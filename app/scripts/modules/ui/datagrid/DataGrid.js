/*
 * Copyright (C) 2008 Apple Inc. All Rights Reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *        notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *        notice, this list of conditions and the following disclaimer in the
 *        documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.         IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var UIUtils = require('./UIUtils.js');
require('./DOMExtension.js');

self.DataGrid = self.DataGrid || {};
DataGrid = DataGrid || {};

DataGrid._preferredWidthSymbol = Symbol('preferredWidth');
DataGrid._columnIdSymbol = Symbol('columnId');
DataGrid._sortIconSymbol = Symbol('sortIcon');
DataGrid._longTextSymbol = Symbol('longText');

function ls(strings) {
  return strings;
}


/**
 * @implements {EventTarget}
 * @unrestricted
 */
class ObjectWrapper {
  constructor() {
    /** @type {(!Map<string|symbol, !Array<!_listenerCallbackTuple>>|undefined)} */
    this._listeners;
  }

  /**
   * @override
   * @param {string|symbol} eventType
   * @param {function(!Common.Event)} listener
   * @param {!Object=} thisObject
   * @return {!Common.EventTarget.EventDescriptor}
   */
  addEventListener(eventType, listener, thisObject) {
    if (!listener) {
      console.assert(false);
    }

    if (!this._listeners) {
      this._listeners = new Map();
    }

    if (!this._listeners.has(eventType)) {
      this._listeners.set(eventType, []);
    }
    this._listeners.get(eventType).push({thisObject: thisObject, listener: listener});
    return {eventTarget: this, eventType: eventType, thisObject: thisObject, listener: listener};
  }

  /**
   * @override
   * @param {symbol} eventType
   * @return {!Promise<*>}
   */
  once(eventType) {
    return new Promise(resolve => {
      const descriptor = this.addEventListener(eventType, event => {
        this.removeEventListener(eventType, descriptor.listener);
        resolve(event.data);
      });
    });
  }

  /**
   * @override
   * @param {string|symbol} eventType
   * @param {function(!Common.Event)} listener
   * @param {!Object=} thisObject
   */
  removeEventListener(eventType, listener, thisObject) {
    console.assert(listener);

    if (!this._listeners || !this._listeners.has(eventType)) {
      return;
    }
    const listeners = this._listeners.get(eventType);
    for (let i = 0; i < listeners.length; ++i) {
      if (listeners[i].listener === listener && listeners[i].thisObject === thisObject) {
        listeners[i].disposed = true;
        listeners.splice(i--, 1);
      }
    }

    if (!listeners.length) {
      this._listeners.delete(eventType);
    }
  }

  /**
   * @override
   * @param {string|symbol} eventType
   * @return {boolean}
   */
  hasEventListeners(eventType) {
    return !!(this._listeners && this._listeners.has(eventType));
  }

  /**
   * @override
   * @param {string|symbol} eventType
   * @param {*=} eventData
   */
  dispatchEventToListeners(eventType, eventData) {
    if (!this._listeners || !this._listeners.has(eventType)) {
      return;
    }

    const event = /** @type {!Common.Event} */ ({data: eventData});
    const listeners = this._listeners.get(eventType).slice(0);
    for (let i = 0; i < listeners.length; ++i) {
      if (!listeners[i].disposed) {
        listeners[i].listener.call(listeners[i].thisObject, event);
      }
    }
  }
}



/**
 * @unrestricted
 * @template NODE_TYPE
 */
class DataGridImpl extends ObjectWrapper {
  /**
   * @param {!DataGrid.Parameters} dataGridParameters
   */
  constructor(dataGridParameters) {
    super();
    const {displayName, columns: columnsArray, editCallback, deleteCallback, refreshCallback} = dataGridParameters;
    this.element = createElementWithClass('div', 'data-grid');
    this.element.tabIndex = 0;
    this.element.addEventListener('keydown', this._keyDown.bind(this), false);
    //this.element.addEventListener('contextmenu', this._contextMenu.bind(this), true);
    this.element.addEventListener('focusin', event => {
      this.updateGridAccessibleName(/* text */ undefined, /* readGridName */ true);
      event.consume(true);
    });
    this.element.addEventListener('focusout', event => {
      this.updateGridAccessibleName(/* text */ '');
      event.consume(true);
    });

    this._displayName = displayName;

    this._editCallback = editCallback;
    this._deleteCallback = deleteCallback;
    this._refreshCallback = refreshCallback;

    const headerContainer = this.element.createChild('div', 'header-container');
    /** @type {!Element} */
    this._headerTable = headerContainer.createChild('table', 'header');
    // Hide the header table from screen readers since titles are also added to data table.
    /** @type {!Object.<string, !Element>} */
    this._headerTableHeaders = {};
    /** @type {!Element} */
    this._scrollContainer = this.element.createChild('div', 'data-container');
    /** @type {!Element} */
    this._dataTable = this._scrollContainer.createChild('table', 'data');

    /** @type {!Element} */
    this._ariaLiveLabel = this.element.createChild('div', 'aria-live-label');

    // FIXME: Add a createCallback which is different from editCallback and has different
    // behavior when creating a new node.
    if (editCallback) {
      this._dataTable.addEventListener('dblclick', this._ondblclick.bind(this), false);
    }
    this._dataTable.addEventListener('mousedown', this._mouseDownInDataTable.bind(this));
    this._dataTable.addEventListener('click', this._clickInDataTable.bind(this), true);

    /** @type {boolean} */
    this._inline = false;

    /** @type {!Array.<!DataGrid.ColumnDescriptor>} */
    this._columnsArray = [];
    /** @type {!Object.<string, !DataGrid.ColumnDescriptor>} */
    this._columns = {};
    /** @type {!Array.<!DataGrid.ColumnDescriptor>} */
    this.visibleColumnsArray = columnsArray;

    columnsArray.forEach(column => this._innerAddColumn(column));

    /** @type {?string} */
    this._cellClass = null;

    /** @type {!Element} */
    this._headerTableColumnGroup = this._headerTable.createChild('colgroup');
    /** @type {!Element} */
    this._headerTableBody = this._headerTable.createChild('tbody');
    /** @type {!Element} */
    this._headerRow = this._headerTableBody.createChild('tr');

    /** @type {!Element} */
    this._dataTableColumnGroup = this._dataTable.createChild('colgroup');
    /**
     * @protected
     * @type {!Element}
     */
    this.dataTableBody = this._dataTable.createChild('tbody');
    /** @type {!Element} */
    this._topFillerRow = this.dataTableBody.createChild('tr', 'data-grid-filler-row revealed');
    /** @type {!Element} */
    this._bottomFillerRow = this.dataTableBody.createChild('tr', 'data-grid-filler-row revealed');

    this.setVerticalPadding(0, 0);
    this._refreshHeader();

    /** @type {?NODE_TYPE} */
    this.selectedNode = null;
    /** @type {boolean} */
    this.expandNodesWhenArrowing = false;
    this.setRootNode(/** @type {!NODE_TYPE} */ (new DataGridNode()));

    this.setHasSelection(false);

    /** @type {number} */
    this.indentWidth = 15;
    /** @type {!Array.<!Element|{__index: number, __position: number}>} */
    this._resizers = [];
    /** @type {boolean} */
    this._columnWidthsInitialized = false;
    /** @type {number} */
    this._cornerWidth = CornerWidth;
    /** @type {!ResizeMethod} */
    this._resizeMethod = ResizeMethod.Nearest;
  }

  /**
   * @return {!NODE_TYPE}
   */
  _firstSelectableNode() {
    let firstSelectableNode = this._rootNode;
    while (firstSelectableNode && !firstSelectableNode.selectable) {
      firstSelectableNode = firstSelectableNode.traverseNextNode(true);
    }
    return firstSelectableNode;
  }

  /**
   * @return {!NODE_TYPE}
   */
  _lastSelectableNode() {
    let lastSelectableNode = this._rootNode;
    let iterator = this._rootNode;
    while (iterator) {
      if (iterator.selectable) {
        lastSelectableNode = iterator;
      }
      iterator = iterator.traverseNextNode(true);
    }
    return lastSelectableNode;
  }

  /**
   * @param {!Element} element
   * @param {*} value
   */
  setElementContent(element, value) {
    const columnId = this.columnIdFromNode(element);
    if (!columnId) {
      return;
    }
    const column = this._columns[columnId];
    if (column.dataType === DataType.Boolean) {
      DataGridImpl.setElementBoolean(element, /** @type {boolean} */ (!!value));
    } else if (value !== null) {
      DataGridImpl.setElementText(element, /** @type {string} */ (value), !!column.longText);
    }
  }

  /**
   * @param {!Element} element
   * @param {string} newText
   * @param {boolean} longText
   */
  static setElementText(element, newText, longText) {
    if (longText && newText.length > 1000) {
      element.textContent = newText.trimEndWithMaxLength(1000);
      element.title = newText;
      element[DataGrid._longTextSymbol] = newText;
    } else {
      element.textContent = newText;
      element.title = '';
      element[DataGrid._longTextSymbol] = undefined;
    }
  }

  /**
   * @param {!Element} element
   * @param {boolean} value
   */
  static setElementBoolean(element, value) {
    element.textContent = value ? '\u2713' : '';
    element.title = '';
  }

  /**
   * @param {boolean} isStriped
   */
  setStriped(isStriped) {
    this.element.classList.toggle('striped-data-grid', isStriped);
  }

  /**
   * @param {boolean} focusable
   */
  setFocusable(focusable) {
    this.element.tabIndex = focusable ? 0 : -1;
  }

  /**
   * @param {boolean} hasSelected
   */
  setHasSelection(hasSelected) {
    // 'no-selection' class causes datagrid to have a focus-indicator border
    this.element.classList.toggle('no-selection', !hasSelected);
  }

  /**
   * @param {string=} text
   * @param {boolean=} readGridName
   */
  updateGridAccessibleName(text, readGridName) {
    // If text provided, update and return
    if (typeof text !== 'undefined') {
      this._ariaLiveLabel.textContent = text;
      return;
    }
    // readGridName: When navigating to the grid from a different element,
    // append the displayname of the grid for SR context.
    let accessibleText;
    if (this.selectedNode && this.selectedNode.existingElement()) {
      let expandText = '';
      if (this.selectedNode.hasChildren()) {
        expandText = this.selectedNode.expanded ? ls`expanded` : ls`collapsed`;
      }
      const rowHeader = readGridName ? ls`${this._displayName} Row ${expandText}` : expandText;
      accessibleText = `${rowHeader} ${this.selectedNode.nodeAccessibleText}`;
    } else {
      accessibleText = `${
          this._displayName}, use the up and down arrow keys to navigate and interact with the rows of the table; Use browse mode to read cell by cell.`;
    }
    this._ariaLiveLabel.textContent = accessibleText;
  }

  /**
   * @return {!Element}
   */
  headerTableBody() {
    return this._headerTableBody;
  }

  /**
   * @param {!DataGrid.ColumnDescriptor} column
   * @param {number=} position
   */
  _innerAddColumn(column, position) {
    const columnId = column.id;
    if (columnId in this._columns) {
      this._innerRemoveColumn(columnId);
    }

    if (position === undefined) {
      position = this._columnsArray.length;
    }

    this._columnsArray.splice(position, 0, column);
    this._columns[columnId] = column;
    if (column.disclosure) {
      this.disclosureColumnId = columnId;
    }

    const cell = createElement('th');
    cell.className = columnId + '-column';
    cell[DataGrid._columnIdSymbol] = columnId;
    this._headerTableHeaders[columnId] = cell;

    const div = createElement('div');
    if (column.titleDOMFragment) {
      div.appendChild(column.titleDOMFragment);
    } else {
      div.textContent = column.title;
    }
    cell.appendChild(div);

    if (column.sort) {
      cell.classList.add(column.sort);
      this._sortColumnCell = cell;
    }

    if (column.sortable) {
      cell.addEventListener('click', this._clickInHeaderCell.bind(this), false);
      cell.classList.add('sortable');
      const icon = UIUtils.Icon.create('', 'sort-order-icon');
      cell.createChild('div', 'sort-order-icon-container').appendChild(icon);
      cell[DataGrid._sortIconSymbol] = icon;
    }
  }

  /**
   * @param {!DataGrid.ColumnDescriptor} column
   * @param {number=} position
   */
  addColumn(column, position) {
    this._innerAddColumn(column, position);
  }

  /**
   * @param {string} columnId
   */
  _innerRemoveColumn(columnId) {
    const column = this._columns[columnId];
    if (!column) {
      return;
    }
    delete this._columns[columnId];
    const index = this._columnsArray.findIndex(columnConfig => columnConfig.id === columnId);
    this._columnsArray.splice(index, 1);
    const cell = this._headerTableHeaders[columnId];
    if (cell.parentElement) {
      cell.parentElement.removeChild(cell);
    }
    delete this._headerTableHeaders[columnId];
  }

  /**
   * @param {string} columnId
   */
  removeColumn(columnId) {
    this._innerRemoveColumn(columnId);
  }

  /**
   * @param {string} cellClass
   */
  setCellClass(cellClass) {
    this._cellClass = cellClass;
  }

  _refreshHeader() {
    this._headerTableColumnGroup.removeChildren();
    this._dataTableColumnGroup.removeChildren();
    this._headerRow.removeChildren();
    this._topFillerRow.removeChildren();
    this._bottomFillerRow.removeChildren();

    for (let i = 0; i < this.visibleColumnsArray.length; ++i) {
      const column = this.visibleColumnsArray[i];
      const columnId = column.id;
      const headerColumn = this._headerTableColumnGroup.createChild('col');
      const dataColumn = this._dataTableColumnGroup.createChild('col');
      if (column.width) {
        headerColumn.style.width = column.width;
        dataColumn.style.width = column.width;
      }
      this._headerRow.appendChild(this._headerTableHeaders[columnId]);
      const topFillerRowCell = this._topFillerRow.createChild('th', 'top-filler-td');
      topFillerRowCell.textContent = column.title;
      topFillerRowCell.scope = 'col';
      this._bottomFillerRow.createChild('td', 'bottom-filler-td')[DataGrid._columnIdSymbol] = columnId;
    }

    this._headerRow.createChild('th', 'corner');
    const topFillerRowCornerCell = this._topFillerRow.createChild('th', 'corner');
    topFillerRowCornerCell.classList.add('top-filler-td');
    topFillerRowCornerCell.scope = 'col';
    this._bottomFillerRow.createChild('td', 'corner').classList.add('bottom-filler-td');
    this._headerTableColumnGroup.createChild('col', 'corner');
    this._dataTableColumnGroup.createChild('col', 'corner');
  }

  /**
   * @param {number} top
   * @param {number} bottom
   * @protected
   */
  setVerticalPadding(top, bottom) {
    const topPx = top + 'px';
    const bottomPx = (top || bottom) ? bottom + 'px' : 'auto';
    if (this._topFillerRow.style.height === topPx && this._bottomFillerRow.style.height === bottomPx) {
      return;
    }
    this._topFillerRow.style.height = topPx;
    this._bottomFillerRow.style.height = bottomPx;
    this.dispatchEventToListeners(Events.PaddingChanged);
  }

  /**
   * @param {!NODE_TYPE} rootNode
   * @protected
   */
  setRootNode(rootNode) {
    if (this._rootNode) {
      this._rootNode.removeChildren();
      this._rootNode.dataGrid = null;
      this._rootNode._isRoot = false;
    }
    /** @type {!NODE_TYPE} */
    this._rootNode = rootNode;
    rootNode._isRoot = true;
    rootNode.setHasChildren(false);
    rootNode._expanded = true;
    rootNode._revealed = true;
    rootNode.selectable = false;
    rootNode.dataGrid = this;
  }

  /**
   * @return {!NODE_TYPE}
   */
  rootNode() {
    return this._rootNode;
  }

  /**
   * @param {!Event} event
   */
  _ondblclick(event) {
    const columnId = this.columnIdFromNode(/** @type {!Node} */ (event.target));
    if (!columnId || !this._columns[columnId].editable) {
      return;
    }
  }


  renderInline() {
    this.element.classList.add('inline');
    this._cornerWidth = 0;
    this._inline = true;
    this.updateWidths();
  }

  /**
   * @param {number} cellIndex
   * @param {boolean=} moveBackward
   * @return {number}
   */
  _nextEditableColumn(cellIndex, moveBackward) {
    const increment = moveBackward ? -1 : 1;
    const columns = this.visibleColumnsArray;
    for (let i = cellIndex + increment; (i >= 0) && (i < columns.length); i += increment) {
      if (columns[i].editable) {
        return i;
      }
    }
    return -1;
  }

  /**
   * @return {?string}
   */
  sortColumnId() {
    if (!this._sortColumnCell) {
      return null;
    }
    return this._sortColumnCell[DataGrid._columnIdSymbol];
  }

  /**
   * @return {?string}
   */
  sortOrder() {
    if (!this._sortColumnCell || this._sortColumnCell.classList.contains(Order.Ascending)) {
      return Order.Ascending;
    }
    if (this._sortColumnCell.classList.contains(Order.Descending)) {
      return Order.Descending;
    }
    return null;
  }

  /**
   * @return {boolean}
   */
  isSortOrderAscending() {
    return !this._sortColumnCell || this._sortColumnCell.classList.contains(Order.Ascending);
  }

  /**
   * @param {!Array.<number>} widths
   * @param {number} minPercent
   * @param {number=} maxPercent
   * @return {!Array.<number>}
   */
  _autoSizeWidths(widths, minPercent, maxPercent) {
    if (minPercent) {
      minPercent = Math.min(minPercent, Math.floor(100 / widths.length));
    }
    let totalWidth = 0;
    for (let i = 0; i < widths.length; ++i) {
      totalWidth += widths[i];
    }
    let totalPercentWidth = 0;
    for (let i = 0; i < widths.length; ++i) {
      let width = Math.round(100 * widths[i] / totalWidth);
      if (minPercent && width < minPercent) {
        width = minPercent;
      } else if (maxPercent && width > maxPercent) {
        width = maxPercent;
      }
      totalPercentWidth += width;
      widths[i] = width;
    }
    let recoupPercent = totalPercentWidth - 100;

    while (minPercent && recoupPercent > 0) {
      for (let i = 0; i < widths.length; ++i) {
        if (widths[i] > minPercent) {
          --widths[i];
          --recoupPercent;
          if (!recoupPercent) {
            break;
          }
        }
      }
    }

    while (maxPercent && recoupPercent < 0) {
      for (let i = 0; i < widths.length; ++i) {
        if (widths[i] < maxPercent) {
          ++widths[i];
          ++recoupPercent;
          if (!recoupPercent) {
            break;
          }
        }
      }
    }

    return widths;
  }

  /**
   * The range of |minPercent| and |maxPercent| is [0, 100].
   * @param {number} minPercent
   * @param {number=} maxPercent
   * @param {number=} maxDescentLevel
   */
  autoSizeColumns(minPercent, maxPercent, maxDescentLevel) {
    let widths = [];
    for (let i = 0; i < this._columnsArray.length; ++i) {
      widths.push((this._columnsArray[i].title || '').length);
    }

    maxDescentLevel = maxDescentLevel || 0;
    const children = this._enumerateChildren(this._rootNode, [], maxDescentLevel + 1);
    for (let i = 0; i < children.length; ++i) {
      const node = children[i];
      for (let j = 0; j < this._columnsArray.length; ++j) {
        const text = String(node.data[this._columnsArray[j].id]);
        if (text.length > widths[j]) {
          widths[j] = text.length;
        }
      }
    }

    widths = this._autoSizeWidths(widths, minPercent, maxPercent);

    for (let i = 0; i < this._columnsArray.length; ++i) {
      this._columnsArray[i].weight = widths[i];
    }
    this._columnWidthsInitialized = false;
    this.updateWidths();
  }

  /**
   * @param {!DataGridNode} rootNode
   * @param {!Array<!DataGridNode>} result
   * @param {number} maxLevel
   * @return {!Array<!NODE_TYPE>}
   */
  _enumerateChildren(rootNode, result, maxLevel) {
    if (!rootNode._isRoot) {
      result.push(rootNode);
    }
    if (!maxLevel) {
      return [];
    }
    for (let i = 0; i < rootNode.children.length; ++i) {
      this._enumerateChildren(rootNode.children[i], result, maxLevel - 1);
    }
    return result;
  }

  onResize() {
    this.updateWidths();
  }

  // Updates the widths of the table, including the positions of the column
  // resizers.
  //
  // IMPORTANT: This function MUST be called once after the element of the
  // DataGrid is attached to its parent element and every subsequent time the
  // width of the parent element is changed in order to make it possible to
  // resize the columns.
  //
  // If this function is not called after the DataGrid is attached to its
  // parent element, then the DataGrid's columns will not be resizable.
  updateWidths() {
    // Do not attempt to use offsetes if we're not attached to the document tree yet.
    if (!this._columnWidthsInitialized && this.element.offsetWidth) {
      // Give all the columns initial widths now so that during a resize,
      // when the two columns that get resized get a percent value for
      // their widths, all the other columns already have percent values
      // for their widths.

      // Use container size to avoid changes of table width caused by change of column widths.
      const tableWidth = this.element.offsetWidth - this._cornerWidth;
      const cells = this._headerTableBody.rows[0].cells;
      const numColumns = cells.length - 1;  // Do not process corner column.
      for (let i = 0; i < numColumns; i++) {
        const column = this.visibleColumnsArray[i];
        if (!column.weight) {
          column.weight = 100 * cells[i].offsetWidth / tableWidth || 10;
        }
      }
      this._columnWidthsInitialized = true;
    }
    this._applyColumnWeights();
  }

  /**
   * @param {string} columnId
   * @returns {number}
   */
  indexOfVisibleColumn(columnId) {
    return this.visibleColumnsArray.findIndex(column => column.id === columnId);
  }

  /**
   * @param {string} name
   */
  setName(name) {
    //this._columnWeightsSetting = self.Common.settings.createSetting('dataGrid-' + name + '-columnWeights', {});
    this._loadColumnWeights();
  }

  _loadColumnWeights() {
    if (!this._columnWeightsSetting) {
      return;
    }
    const weights = this._columnWeightsSetting.get();
    for (let i = 0; i < this._columnsArray.length; ++i) {
      const column = this._columnsArray[i];
      const weight = weights[column.id];
      if (weight) {
        column.weight = weight;
      }
    }
    this._applyColumnWeights();
  }

  _saveColumnWeights() {
    if (!this._columnWeightsSetting) {
      return;
    }
    const weights = {};
    for (let i = 0; i < this._columnsArray.length; ++i) {
      const column = this._columnsArray[i];
      weights[column.id] = column.weight;
    }
    this._columnWeightsSetting.set(weights);
  }

  wasShown() {
    this._loadColumnWeights();
  }

  willHide() {
  }

  _applyColumnWeights() {
    let tableWidth = this.element.offsetWidth - this._cornerWidth;
    if (tableWidth <= 0) {
      return;
    }

    let sumOfWeights = 0.0;
    const fixedColumnWidths = [];
    for (let i = 0; i < this.visibleColumnsArray.length; ++i) {
      const column = this.visibleColumnsArray[i];
      if (column.fixedWidth) {
        const width = this._headerTableColumnGroup.children[i][DataGrid._preferredWidthSymbol] ||
            this._headerTableBody.rows[0].cells[i].offsetWidth;
        fixedColumnWidths[i] = width;
        tableWidth -= width;
      } else {
        sumOfWeights += this.visibleColumnsArray[i].weight;
      }
    }
    let sum = 0;
    let lastOffset = 0;

    for (let i = 0; i < this.visibleColumnsArray.length; ++i) {
      const column = this.visibleColumnsArray[i];
      let width;
      if (column.fixedWidth) {
        width = fixedColumnWidths[i];
      } else {
        sum += column.weight;
        const offset = (sum * tableWidth / sumOfWeights) | 0;
        width = offset - lastOffset;
        lastOffset = offset;
      }
      this._setPreferredWidth(i, width);
    }

    this._positionResizers();
  }

  /**
   * @param {!Object.<string, boolean>} columnsVisibility
   */
  setColumnsVisiblity(columnsVisibility) {
    this.visibleColumnsArray = [];
    for (let i = 0; i < this._columnsArray.length; ++i) {
      const column = this._columnsArray[i];
      if (columnsVisibility[column.id]) {
        this.visibleColumnsArray.push(column);
      }
    }
    this._refreshHeader();
    this._applyColumnWeights();
    const nodes = this._enumerateChildren(this.rootNode(), [], -1);
    for (let i = 0; i < nodes.length; ++i) {
      nodes[i].refresh();
    }
  }

  get scrollContainer() {
    return this._scrollContainer;
  }

  _positionResizers() {
    const headerTableColumns = this._headerTableColumnGroup.children;
    const numColumns = headerTableColumns.length - 1;  // Do not process corner column.
    const left = [];
    const resizers = this._resizers;

    while (resizers.length > numColumns - 1) {
      resizers.pop().remove();
    }

    for (let i = 0; i < numColumns - 1; i++) {
      // Get the width of the cell in the first (and only) row of the
      // header table in order to determine the width of the column, since
      // it is not possible to query a column for its width.
      left[i] = (left[i - 1] || 0) + this._headerTableBody.rows[0].cells[i].offsetWidth;
    }

    // Make n - 1 resizers for n columns.
    for (let i = 0; i < numColumns - 1; i++) {
      let resizer = resizers[i];
      if (!resizer) {
        // This is the first call to updateWidth, so the resizers need
        // to be created.
        resizer = createElement('div');
        resizer.__index = i;
        resizer.classList.add('data-grid-resizer');
        // This resizer is associated with the column to its right.
        UIUtils.installDragHandle(
            resizer, this._startResizerDragging.bind(this), this._resizerDragging.bind(this),
            this._endResizerDragging.bind(this), 'col-resize');
        this.element.appendChild(resizer);
        resizers.push(resizer);
      }
      if (resizer.__position !== left[i]) {
        resizer.__position = left[i];
        resizer.style.left = left[i] + 'px';
      }
    }
  }

  addCreationNode(hasChildren) {
    if (this.creationNode) {
      this.creationNode.makeNormal();
    }

    const emptyData = {};
    for (const column in this._columns) {
      emptyData[column] = null;
    }
    this.creationNode = new CreationDataGridNode(emptyData, hasChildren);
    this.rootNode().appendChild(this.creationNode);
  }

  /**
   * @param {!Event} event
   * @suppressGlobalPropertiesCheck
   */
  _keyDown(event) {
    if (event.shiftKey || event.metaKey || event.ctrlKey ) {
      return;
    }

    let handled = false;
    let nextSelectedNode;
    if (!this.selectedNode) {
      // Select the first or last node based on the arrow key direction
      if (event.key === 'ArrowUp' && !event.altKey) {
        nextSelectedNode = this._lastSelectableNode();
      } else if (event.key === 'ArrowDown' && !event.altKey) {
        nextSelectedNode = this._firstSelectableNode();
      }
      handled = nextSelectedNode ? true : false;
    } else if (event.key === 'ArrowUp' && !event.altKey) {
      nextSelectedNode = this.selectedNode.traversePreviousNode(true);
      while (nextSelectedNode && !nextSelectedNode.selectable) {
        nextSelectedNode = nextSelectedNode.traversePreviousNode(true);
      }
      handled = nextSelectedNode ? true : false;
    } else if (event.key === 'ArrowDown' && !event.altKey) {
      nextSelectedNode = this.selectedNode.traverseNextNode(true);
      while (nextSelectedNode && !nextSelectedNode.selectable) {
        nextSelectedNode = nextSelectedNode.traverseNextNode(true);
      }
      handled = nextSelectedNode ? true : false;
    } else if (event.key === 'ArrowLeft') {
      if (this.selectedNode.expanded) {
        if (event.altKey) {
          this.selectedNode.collapseRecursively();
        } else {
          this.selectedNode.collapse();
        }
        handled = true;
      } else if (this.selectedNode.parent && !this.selectedNode.parent._isRoot) {
        handled = true;
        if (this.selectedNode.parent.selectable) {
          nextSelectedNode = this.selectedNode.parent;
          handled = nextSelectedNode ? true : false;
        } else if (this.selectedNode.parent) {
          this.selectedNode.parent.collapse();
        }
      }
    } else if (event.key === 'ArrowRight') {
      if (!this.selectedNode.revealed) {
        this.selectedNode.reveal();
        handled = true;
      } else if (this.selectedNode.hasChildren()) {
        handled = true;
        if (this.selectedNode.expanded) {
          nextSelectedNode = this.selectedNode.children[0];
          handled = nextSelectedNode ? true : false;
        } else {
          if (event.altKey) {
            this.selectedNode.expandRecursively();
          } else {
            this.selectedNode.expand();
          }
        }
      }
    } else if (event.keyCode === 8 || event.keyCode === 46) {
      if (this._deleteCallback) {
        handled = true;
        this._deleteCallback(this.selectedNode);
      }
    } else if (isEnterKey(event)) {
      if (this._editCallback) {
        handled = true;

      } else {
        this.dispatchEventToListeners(Events.OpenedNode, this.selectedNode);
      }
    }

    if (nextSelectedNode) {
      nextSelectedNode.reveal();
      nextSelectedNode.select();
    }

    if ((event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' ||
         event.key === 'ArrowRight') &&
        document.activeElement !== this.element) {
      // crbug.com/1005449
      // navigational keys pressed but current DataGrid panel has lost focus;
      // re-focus to ensure subsequent keydowns can be registered within this DataGrid
      this.element.focus();
    }

    if (handled) {
      event.consume(true);
    }
  }

  /**
   * @param {?NODE_TYPE} root
   * @param {boolean} onlyAffectsSubtree
   */
  updateSelectionBeforeRemoval(root, onlyAffectsSubtree) {
    let ancestor = this.selectedNode;
    while (ancestor && ancestor !== root) {
      ancestor = ancestor.parent;
    }
    // Selection is not in the subtree being deleted.
    if (!ancestor) {
      return;
    }

    let nextSelectedNode;
    // Skip subtree being deleted when looking for the next selectable node.
    for (ancestor = root; ancestor && !ancestor.nextSibling; ancestor = ancestor.parent) {
    }
    if (ancestor) {
      nextSelectedNode = ancestor.nextSibling;
    }
    while (nextSelectedNode && !nextSelectedNode.selectable) {
      nextSelectedNode = nextSelectedNode.traverseNextNode(true);
    }

    if (!nextSelectedNode || nextSelectedNode.isCreationNode) {
      nextSelectedNode = root.traversePreviousNode(true);
      while (nextSelectedNode && !nextSelectedNode.selectable) {
        nextSelectedNode = nextSelectedNode.traversePreviousNode(true);
      }
    }
    if (nextSelectedNode) {
      nextSelectedNode.reveal();
      nextSelectedNode.select();
    } else {
      this.selectedNode.deselect();
    }
  }

  /**
   * @param {!Node} target
   * @return {?NODE_TYPE}
   */
  dataGridNodeFromNode(target) {
    const rowElement = target.enclosingNodeOrSelfWithNodeName('tr');
    return rowElement && rowElement._dataGridNode;
  }

  /**
   * @param {!Node} target
   * @return {?string}
   */
  columnIdFromNode(target) {
    const cellElement = target.enclosingNodeOrSelfWithNodeName('td');
    return cellElement && cellElement[DataGrid._columnIdSymbol];
  }

  /**
   * @param {!Event} event
   */
  _clickInHeaderCell(event) {
    const cell = event.target.enclosingNodeOrSelfWithNodeName('th');
    if (!cell) {
      return;
    }
    this._sortByColumnHeaderCell(cell);
  }

  /**
   * @param {!Node} cell
   */
  _sortByColumnHeaderCell(cell) {
    if ((cell[DataGrid._columnIdSymbol] === undefined) || !cell.classList.contains('sortable')) {
      return;
    }

    let sortOrder = Order.Ascending;
    if ((cell === this._sortColumnCell) && this.isSortOrderAscending()) {
      sortOrder = Order.Descending;
    }

    if (this._sortColumnCell) {
      this._sortColumnCell.classList.remove(Order.Ascending, Order.Descending);
    }
    this._sortColumnCell = cell;

    cell.classList.add(sortOrder);
    const icon = cell[DataGrid._sortIconSymbol];
    icon.setIconType(sortOrder === Order.Ascending ? 'smallicon-triangle-up' : 'smallicon-triangle-down');

    this.dispatchEventToListeners(Events.SortingChanged);
  }

  /**
   * @param {string} columnId
   * @param {!Order} sortOrder
   */
  markColumnAsSortedBy(columnId, sortOrder) {
    if (this._sortColumnCell) {
      this._sortColumnCell.classList.remove(Order.Ascending, Order.Descending);
    }
    this._sortColumnCell = this._headerTableHeaders[columnId];
    this._sortColumnCell.classList.add(sortOrder);
  }

  /**
   * @param {string} columnId
   * @return {!Element}
   */
  headerTableHeader(columnId) {
    return this._headerTableHeaders[columnId];
  }

  /**
   * @param {!Event} event
   */
  _mouseDownInDataTable(event) {
    const target = /** @type {!Node} */ (event.target);
    const gridNode = this.dataGridNodeFromNode(target);
    if (!gridNode || !gridNode.selectable || gridNode.isEventWithinDisclosureTriangle(event)) {
      return;
    }

    const columnId = this.columnIdFromNode(target);
    if (columnId && this._columns[columnId].nonSelectable) {
      return;
    }

    if (event.metaKey) {
      if (gridNode.selected) {
        gridNode.deselect();
      } else {
        gridNode.select();
      }
    } else {
      gridNode.select();
      this.dispatchEventToListeners(Events.OpenedNode, gridNode);
    }
  }

  /**
   * @param {!Event} event
   */
  _clickInDataTable(event) {
    const gridNode = this.dataGridNodeFromNode(/** @type {!Node} */ (event.target));
    if (!gridNode || !gridNode.hasChildren() || !gridNode.isEventWithinDisclosureTriangle(event)) {
      return;
    }

    if (gridNode.expanded) {
      if (event.altKey) {
        gridNode.collapseRecursively();
      } else {
        gridNode.collapse();
      }
    } else {
      if (event.altKey) {
        gridNode.expandRecursively();
      } else {
        gridNode.expand();
      }
    }
  }

  /**
   * @param {!ResizeMethod} method
   */
  setResizeMethod(method) {
    this._resizeMethod = method;
  }

  /**
   * @param {!Event} event
   * @return {boolean}
   */
  _startResizerDragging(event) {
    this._currentResizer = event.target;
    return true;
  }

  _endResizerDragging() {
    this._currentResizer = null;
    this._saveColumnWeights();
  }

  /**
   * @param {!Event} event
   */
  _resizerDragging(event) {
    const resizer = this._currentResizer;
    if (!resizer) {
      return;
    }

    // Constrain the dragpoint to be within the containing div of the
    // datagrid.
    let dragPoint = event.clientX - this.element.totalOffsetLeft();
    const firstRowCells = this._headerTableBody.rows[0].cells;
    let leftEdgeOfPreviousColumn = 0;
    // Constrain the dragpoint to be within the space made up by the
    // column directly to the left and the column directly to the right.
    let leftCellIndex = resizer.__index;
    let rightCellIndex = leftCellIndex + 1;
    for (let i = 0; i < leftCellIndex; i++) {
      leftEdgeOfPreviousColumn += firstRowCells[i].offsetWidth;
    }

    // Differences for other resize methods
    if (this._resizeMethod === ResizeMethod.Last) {
      rightCellIndex = this._resizers.length;
    } else if (this._resizeMethod === ResizeMethod.First) {
      leftEdgeOfPreviousColumn += firstRowCells[leftCellIndex].offsetWidth - firstRowCells[0].offsetWidth;
      leftCellIndex = 0;
    }

    const rightEdgeOfNextColumn =
        leftEdgeOfPreviousColumn + firstRowCells[leftCellIndex].offsetWidth + firstRowCells[rightCellIndex].offsetWidth;

    // Give each column some padding so that they don't disappear.
    const leftMinimum = leftEdgeOfPreviousColumn + ColumnResizePadding;
    const rightMaximum = rightEdgeOfNextColumn - ColumnResizePadding;
    if (leftMinimum > rightMaximum) {
      return;
    }

    dragPoint = Number.constrain(dragPoint, leftMinimum, rightMaximum);

    const position = (dragPoint - CenterResizerOverBorderAdjustment);
    resizer.__position = position;
    resizer.style.left = position + 'px';

    this._setPreferredWidth(leftCellIndex, dragPoint - leftEdgeOfPreviousColumn);
    this._setPreferredWidth(rightCellIndex, rightEdgeOfNextColumn - dragPoint);

    const leftColumn = this.visibleColumnsArray[leftCellIndex];
    const rightColumn = this.visibleColumnsArray[rightCellIndex];
    if (leftColumn.weight || rightColumn.weight) {
      const sumOfWeights = leftColumn.weight + rightColumn.weight;
      const delta = rightEdgeOfNextColumn - leftEdgeOfPreviousColumn;
      leftColumn.weight = (dragPoint - leftEdgeOfPreviousColumn) * sumOfWeights / delta;
      rightColumn.weight = (rightEdgeOfNextColumn - dragPoint) * sumOfWeights / delta;
    }

    this._positionResizers();
    event.preventDefault();
  }

  /**
   * @param {number} columnIndex
   * @param {number} width
   */
  _setPreferredWidth(columnIndex, width) {
    const pxWidth = width + 'px';
    this._headerTableColumnGroup.children[columnIndex][DataGrid._preferredWidthSymbol] = width;
    this._headerTableColumnGroup.children[columnIndex].style.width = pxWidth;
    this._dataTableColumnGroup.children[columnIndex].style.width = pxWidth;
  }

  /**
   * @param {string} columnId
   * @return {number}
   */
  columnOffset(columnId) {
    if (!this.element.offsetWidth) {
      return 0;
    }
    for (let i = 1; i < this.visibleColumnsArray.length; ++i) {
      if (columnId === this.visibleColumnsArray[i].id) {
        if (this._resizers[i - 1]) {
          return this._resizers[i - 1].__position;
        }
      }
    }
    return 0;
  }

  topFillerRowElement() {
    return this._topFillerRow;
  }
}

// Keep in sync with .data-grid col.corner style rule.
const CornerWidth = 14;


/** @enum {symbol} */
const Events = {
  SelectedNode: Symbol('SelectedNode'),
  DeselectedNode: Symbol('DeselectedNode'),
  OpenedNode: Symbol('OpenedNode'),
  SortingChanged: Symbol('SortingChanged'),
  PaddingChanged: Symbol('PaddingChanged'),
};

/** @enum {string} */
const Order = {
  Ascending: 'sort-ascending',
  Descending: 'sort-descending'
};

/** @enum {string} */
const Align = {
  Center: 'center',
  Right: 'right'
};

/** @enum {symbol} */
const DataType = {
  String: Symbol('String'),
  Boolean: Symbol('Boolean'),
};

const ColumnResizePadding = 24;
const CenterResizerOverBorderAdjustment = 3;

/** @enum {string} */
const ResizeMethod = {
  Nearest: 'nearest',
  First: 'first',
  Last: 'last'
};

/**
 * @unrestricted
 * @template NODE_TYPE
 */
class DataGridNode extends ObjectWrapper {
  /**
   * @param {?Object.<string, *>=} data
   * @param {boolean=} hasChildren
   */
  constructor(data, hasChildren) {
    super();
    /** @type {?Element} */
    this._element = null;
    /** @protected @type {boolean} @suppress {accessControls} */
    this._expanded = false;
    /** @type {boolean} */
    this._selected = false;
    /** @type {boolean} */
    this._dirty = false;
    /** @type {boolean} */
    this._inactive = false;
    /** @type {number|undefined} */
    this._depth;
    /** @type {boolean|undefined} */
    this._revealed;
    /** @type {boolean} */
    this._attached = false;
    /** @type {?{parent: !NODE_TYPE, index: number}} */
    this._savedPosition = null;
    /** @type {boolean} */
    this._shouldRefreshChildren = true;
    /** @type {!Object.<string, *>} */
    this._data = data || {};
    /** @type {boolean} */
    this._hasChildren = hasChildren || false;
    /** @type {!Array.<!NODE_TYPE>} */
    this.children = [];
    /** @type {?DataGridImpl} */
    this.dataGrid = null;
    /** @type {?NODE_TYPE} */
    this.parent = null;
    /** @type {?NODE_TYPE} */
    this.previousSibling = null;
    /** @type {?NODE_TYPE} */
    this.nextSibling = null;
    /** @type {number} */
    this.disclosureToggleWidth = 10;

    /** @type {boolean} */
    this.selectable = true;

    /** @type {boolean} */
    this._isRoot = false;

    /** @type {string} */
    this.nodeAccessibleText = '';
    /** @type {!Map<string, string>}} */
    this.cellAccessibleTextMap = new Map();
  }

  /**
   * @return {!Element}
   */
  element() {
    if (!this._element) {
      const element = this.createElement();
      this.createCells(element);
    }
    return /** @type {!Element} */ (this._element);
  }

  /**
   * @protected
   * @return {!Element}
   */
  createElement() {
    this._element = createElementWithClass('tr', 'data-grid-data-grid-node');
    this._element._dataGridNode = this;

    if (this._hasChildren) {
      this._element.classList.add('parent');
    }
    if (this.expanded) {
      this._element.classList.add('expanded');
    }
    if (this.selected) {
      this._element.classList.add('selected');
    }
    if (this.revealed) {
      this._element.classList.add('revealed');
    }
    if (this.dirty) {
      this._element.classList.add('dirty');
    }
    if (this.inactive) {
      this._element.classList.add('inactive');
    }
    return this._element;
  }

  /**
   * @return {?Element}
   */
  existingElement() {
    return this._element || null;
  }

  /**
   * @protected
   */
  resetElement() {
    this._element = null;
  }

  /**
   * @param {!Element} element
   * @protected
   */
  createCells(element) {
    element.removeChildren();
    const columnsArray = this.dataGrid.visibleColumnsArray;
    const accessibleTextArray = [];
    // Add depth if node is part of a tree
    if (this._hasChildren || !this.parent._isRoot) {
      accessibleTextArray.push(ls`level ${this.depth + 1}`);
    }
    for (let i = 0; i < columnsArray.length; ++i) {
      const column = columnsArray[i];
      const cell = element.appendChild(this.createCell(column.id));
      // Add each visibile cell to the node's accessible text by gathering 'Column Title: content'
      const localizedTitle = ls`${column.title}`;
      accessibleTextArray.push(`${localizedTitle}: ${this.cellAccessibleTextMap.get(column.id) || cell.textContent}`);
    }
    this.nodeAccessibleText = accessibleTextArray.join(', ');
    element.appendChild(this._createTDWithClass('corner'));
  }

  /**
   * @return {!Object.<string, *>}
   */
  get data() {
    return this._data;
  }

  /**
   * @param {!Object.<string, *>} x
   */
  set data(x) {
    this._data = x || {};
    this.refresh();
  }

  /**
   * @return {boolean}
   */
  get revealed() {
    if (this._revealed !== undefined) {
      return this._revealed;
    }

    let currentAncestor = this.parent;
    while (currentAncestor && !currentAncestor._isRoot) {
      if (!currentAncestor.expanded) {
        this._revealed = false;
        return false;
      }

      currentAncestor = currentAncestor.parent;
    }

    this.revealed = true;
    return true;
  }

  /**
   * @param {boolean} x
   */
  set revealed(x) {
    if (this._revealed === x) {
      return;
    }

    this._revealed = x;

    if (this._element) {
      this._element.classList.toggle('revealed', this._revealed);
    }

    for (let i = 0; i < this.children.length; ++i) {
      this.children[i].revealed = x && this.expanded;
    }
  }

  /**
   * @return {boolean}
   */
  isDirty() {
    return this._dirty;
  }

  /**
   * @param {boolean} dirty
   */
  setDirty(dirty) {
    if (this._dirty === dirty) {
      return;
    }
    this._dirty = dirty;
    if (!this._element) {
      return;
    }
    if (dirty) {
      this._element.classList.add('dirty');
    } else {
      this._element.classList.remove('dirty');
    }
  }


  /**
   * @return {boolean}
   */
  isInactive() {
    return this._inactive;
  }

  /**
   * @param {boolean} inactive
   */
  setInactive(inactive) {
    if (this._inactive === inactive) {
      return;
    }
    this._inactive = inactive;
    if (!this._element) {
      return;
    }
    if (inactive) {
      this._element.classList.add('inactive');
    } else {
      this._element.classList.remove('inactive');
    }
  }

  /**
   * @return {boolean}
   */
  hasChildren() {
    return this._hasChildren;
  }

  /**
   * @param {boolean} x
   */
  setHasChildren(x) {
    if (this._hasChildren === x) {
      return;
    }

    this._hasChildren = x;

    if (!this._element) {
      return;
    }

    this._element.classList.toggle('parent', this._hasChildren);
    this._element.classList.toggle('expanded', this._hasChildren && this.expanded);
  }

  /**
   * @return {number}
   */
  get depth() {
    if (this._depth !== undefined) {
      return this._depth;
    }
    if (this.parent && !this.parent._isRoot) {
      this._depth = this.parent.depth + 1;
    } else {
      this._depth = 0;
    }
    return this._depth;
  }

  /**
   * @return {number}
   */
  get leftPadding() {
    return this.depth * this.dataGrid.indentWidth;
  }

  /**
   * @return {boolean}
   */
  get shouldRefreshChildren() {
    return this._shouldRefreshChildren;
  }

  /**
   * @param {boolean} x
   */
  set shouldRefreshChildren(x) {
    this._shouldRefreshChildren = x;
    if (x && this.expanded) {
      this.expand();
    }
  }

  /**
   * @return {boolean}
   */
  get selected() {
    return this._selected;
  }

  /**
   * @param {boolean} x
   */
  set selected(x) {
    if (x) {
      this.select();
    } else {
      this.deselect();
    }
  }

  /**
   * @return {boolean}
   */
  get expanded() {
    return this._expanded;
  }

  /**
   * @param {boolean} x
   */
  set expanded(x) {
    if (x) {
      this.expand();
    } else {
      this.collapse();
    }
  }

  refresh() {
    if (!this.dataGrid) {
      this._element = null;
    }
    if (!this._element) {
      return;
    }
    this.createCells(this._element);
  }

  /**
   * @param {string} className
   * @return {!Element}
   */
  _createTDWithClass(className) {
    const cell = createElementWithClass('td', className);
    const cellClass = this.dataGrid._cellClass;
    if (cellClass) {
      cell.classList.add(cellClass);
    }
    return cell;
  }

  /**
   * @param {string} columnId
   * @return {!Element}
   */
  createTD(columnId) {
    const cell = this._createTDWithClass(columnId + '-column');
    cell[DataGrid._columnIdSymbol] = columnId;

    const alignment = this.dataGrid._columns[columnId].align;
    if (alignment) {
      cell.classList.add(alignment);
    }

    if (columnId === this.dataGrid.disclosureColumnId) {
      cell.classList.add('disclosure');
      if (this.leftPadding) {
        cell.style.setProperty('padding-left', this.leftPadding + 'px');
      }
    }

    return cell;
  }

  /**
   * @param {string} columnId
   * @return {!Element}
   */
  createCell(columnId) {
    const cell = this.createTD(columnId);
    const data = this.data[columnId];
    if (data instanceof Node) {
      cell.appendChild(data);
    } else if (data !== null) {
      this.dataGrid.setElementContent(cell, /** @type {string} */ (data));
    }

    return cell;
  }

  /**
   * @return {number}
   */
  nodeSelfHeight() {
    return 20;
  }

  /**
   * @param {!NODE_TYPE} child
   */
  appendChild(child) {
    this.insertChild(child, this.children.length);
  }

  /**
   * @param {boolean=} onlyCaches
   */
  resetNode(onlyCaches) {
    // @TODO(allada) This is a hack to make sure ViewportDataGrid can clean up these caches. Try Not To Use.
    delete this._depth;
    delete this._revealed;
    if (onlyCaches) {
      return;
    }
    if (this.previousSibling) {
      this.previousSibling.nextSibling = this.nextSibling;
    }
    if (this.nextSibling) {
      this.nextSibling.previousSibling = this.previousSibling;
    }
    this.dataGrid = null;
    this.parent = null;
    this.nextSibling = null;
    this.previousSibling = null;
    this._attached = false;
  }

  /**
   * @param {!NODE_TYPE} child
   * @param {number} index
   */
  insertChild(child, index) {
    if (!child) {
      throw 'insertChild: Node can\'t be undefined or null.';
    }
    if (child.parent === this) {
      const currentIndex = this.children.indexOf(child);
      if (currentIndex < 0) {
        console.assert(false, 'Inconsistent DataGrid state');
      }
      if (currentIndex === index) {
        return;
      }
      if (currentIndex < index) {
        --index;
      }
    }

    child.remove();

    this.children.splice(index, 0, child);
    this.setHasChildren(true);

    child.parent = this;
    child.dataGrid = this.dataGrid;
    child.recalculateSiblings(index);

    child._shouldRefreshChildren = true;

    let current = child.children[0];
    while (current) {
      current.resetNode(true);
      current.dataGrid = this.dataGrid;
      current._attached = false;
      current._shouldRefreshChildren = true;
      current = current.traverseNextNode(false, child, true);
    }

    if (this.expanded) {
      child._attach();
    }
    if (!this.revealed) {
      child.revealed = false;
    }
  }

  remove() {
    if (this.parent) {
      this.parent.removeChild(this);
    }
  }

  /**
   * @param {!NODE_TYPE} child
   */
  removeChild(child) {
    if (!child) {
      throw 'removeChild: Node can\'t be undefined or null.';
    }
    if (child.parent !== this) {
      throw 'removeChild: Node is not a child of this node.';
    }

    if (this.dataGrid) {
      this.dataGrid.updateSelectionBeforeRemoval(child, false);
    }

    child._detach();
    child.resetNode();
    this.children.remove(child, true);

    if (this.children.length <= 0) {
      this.setHasChildren(false);
    }
  }

  removeChildren() {
    if (this.dataGrid) {
      this.dataGrid.updateSelectionBeforeRemoval(this, true);
    }
    for (let i = 0; i < this.children.length; ++i) {
      const child = this.children[i];
      child._detach();
      child.resetNode();
    }

    this.children = [];
    this.setHasChildren(false);
  }

  /**
   * @param {number} myIndex
   */
  recalculateSiblings(myIndex) {
    if (!this.parent) {
      return;
    }

    const previousChild = this.parent.children[myIndex - 1] || null;
    if (previousChild) {
      previousChild.nextSibling = this;
    }
    this.previousSibling = previousChild;

    const nextChild = this.parent.children[myIndex + 1] || null;
    if (nextChild) {
      nextChild.previousSibling = this;
    }
    this.nextSibling = nextChild;
  }

  collapse() {
    if (this._isRoot) {
      return;
    }
    if (this._element) {
      this._element.classList.remove('expanded');
    }

    this._expanded = false;
    if (this.selected) {
      this.dataGrid.updateGridAccessibleName(/* text */ ls`collapsed`);
    }

    for (let i = 0; i < this.children.length; ++i) {
      this.children[i].revealed = false;
    }
  }

  collapseRecursively() {
    let item = this;
    while (item) {
      if (item.expanded) {
        item.collapse();
      }
      item = item.traverseNextNode(false, this, true);
    }
  }

  populate() {
  }

  expand() {
    if (!this._hasChildren || this.expanded) {
      return;
    }
    if (this._isRoot) {
      return;
    }

    if (this.revealed && !this._shouldRefreshChildren) {
      for (let i = 0; i < this.children.length; ++i) {
        this.children[i].revealed = true;
      }
    }

    if (this._shouldRefreshChildren) {
      for (let i = 0; i < this.children.length; ++i) {
        this.children[i]._detach();
      }

      this.populate();

      if (this._attached) {
        for (let i = 0; i < this.children.length; ++i) {
          const child = this.children[i];
          if (this.revealed) {
            child.revealed = true;
          }
          child._attach();
        }
      }

      this._shouldRefreshChildren = false;
    }

    if (this._element) {
      this._element.classList.add('expanded');
    }
    if (this.selected) {
      this.dataGrid.updateGridAccessibleName(/* text */ ls`expanded`);
    }

    this._expanded = true;
  }

  expandRecursively() {
    let item = this;
    while (item) {
      item.expand();
      item = item.traverseNextNode(false, this);
    }
  }

  reveal() {
    if (this._isRoot) {
      return;
    }
    let currentAncestor = this.parent;
    while (currentAncestor && !currentAncestor._isRoot) {
      if (!currentAncestor.expanded) {
        currentAncestor.expand();
      }
      currentAncestor = currentAncestor.parent;
    }

    this.element().scrollIntoViewIfNeeded(false);
  }

  /**
   * @param {boolean=} supressSelectedEvent
   */
  select(supressSelectedEvent) {
    if (!this.dataGrid || !this.selectable || this.selected) {
      return;
    }

    if (this.dataGrid.selectedNode) {
      this.dataGrid.selectedNode.deselect();
    }

    this._selected = true;
    this.dataGrid.selectedNode = this;

    if (this._element) {
      this._element.classList.add('selected');
      this.dataGrid.setHasSelection(true);
      this.dataGrid.updateGridAccessibleName();
    }

    if (!supressSelectedEvent) {
      this.dataGrid.dispatchEventToListeners(Events.SelectedNode, this);
    }
  }

  revealAndSelect() {
    if (this._isRoot) {
      return;
    }
    this.reveal();
    this.select();
  }

  /**
   * @param {boolean=} supressDeselectedEvent
   */
  deselect(supressDeselectedEvent) {
    if (!this.dataGrid || this.dataGrid.selectedNode !== this || !this.selected) {
      return;
    }

    this._selected = false;
    this.dataGrid.selectedNode = null;

    if (this._element) {
      this._element.classList.remove('selected');
      this.dataGrid.setHasSelection(false);
      this.dataGrid.updateGridAccessibleName();
    }

    if (!supressDeselectedEvent) {
      this.dataGrid.dispatchEventToListeners(Events.DeselectedNode);
    }
  }

  /**
   * @param {boolean} skipHidden
   * @param {?NODE_TYPE=} stayWithin
   * @param {boolean=} dontPopulate
   * @param {!Object=} info
   * @return {?NODE_TYPE}
   */
  traverseNextNode(skipHidden, stayWithin, dontPopulate, info) {
    if (!dontPopulate && this._hasChildren) {
      this.populate();
    }

    if (info) {
      info.depthChange = 0;
    }

    let node = (!skipHidden || this.revealed) ? this.children[0] : null;
    if (node && (!skipHidden || this.expanded)) {
      if (info) {
        info.depthChange = 1;
      }
      return node;
    }

    if (this === stayWithin) {
      return null;
    }

    node = (!skipHidden || this.revealed) ? this.nextSibling : null;
    if (node) {
      return node;
    }

    node = this;
    while (node && !node._isRoot && !((!skipHidden || node.revealed) ? node.nextSibling : null) &&
           node.parent !== stayWithin) {
      if (info) {
        info.depthChange -= 1;
      }
      node = node.parent;
    }

    if (!node) {
      return null;
    }

    return (!skipHidden || node.revealed) ? node.nextSibling : null;
  }

  /**
   * @param {boolean} skipHidden
   * @param {boolean=} dontPopulate
   * @return {?NODE_TYPE}
   */
  traversePreviousNode(skipHidden, dontPopulate) {
    let node = (!skipHidden || this.revealed) ? this.previousSibling : null;
    if (!dontPopulate && node && node._hasChildren) {
      node.populate();
    }

    while (node &&
           ((!skipHidden || (node.revealed && node.expanded)) ? node.children[node.children.length - 1] : null)) {
      if (!dontPopulate && node._hasChildren) {
        node.populate();
      }
      node = ((!skipHidden || (node.revealed && node.expanded)) ? node.children[node.children.length - 1] : null);
    }

    if (node) {
      return node;
    }

    if (!this.parent || this.parent._isRoot) {
      return null;
    }

    return this.parent;
  }

  /**
   * @param {!Event} event
   * @return {boolean}
   */
  isEventWithinDisclosureTriangle(event) {
    if (!this._hasChildren) {
      return false;
    }
    const cell = event.target.enclosingNodeOrSelfWithNodeName('td');
    if (!cell || !cell.classList.contains('disclosure')) {
      return false;
    }

    const left = cell.totalOffsetLeft() + this.leftPadding;
    return event.pageX >= left && event.pageX <= left + this.disclosureToggleWidth;
  }

  _attach() {
    if (!this.dataGrid || this._attached) {
      return;
    }

    this._attached = true;

    const previousNode = this.traversePreviousNode(true, true);
    const previousElement = previousNode ? previousNode.element() : this.dataGrid._topFillerRow;
    this.dataGrid.dataTableBody.insertBefore(this.element(), previousElement.nextSibling);

    if (this.expanded) {
      for (let i = 0; i < this.children.length; ++i) {
        this.children[i]._attach();
      }
    }
  }

  _detach() {
    if (!this._attached) {
      return;
    }

    this._attached = false;

    if (this._element) {
      this._element.remove();
    }

    for (let i = 0; i < this.children.length; ++i) {
      this.children[i]._detach();
    }
  }

  savePosition() {
    if (this._savedPosition) {
      return;
    }

    if (!this.parent) {
      throw 'savePosition: Node must have a parent.';
    }
    this._savedPosition = {parent: this.parent, index: this.parent.children.indexOf(this)};
  }

  restorePosition() {
    if (!this._savedPosition) {
      return;
    }

    if (this.parent !== this._savedPosition.parent) {
      this._savedPosition.parent.insertChild(this, this._savedPosition.index);
    }

    this._savedPosition = null;
  }
}

/**
 * @unrestricted
 * @extends {DataGridNode<!NODE_TYPE>}
 * @template NODE_TYPE
 */
class CreationDataGridNode extends DataGridNode {
  constructor(data, hasChildren) {
    super(data, hasChildren);
    /** @type {boolean} */
    this.isCreationNode = true;
  }

  makeNormal() {
    this.isCreationNode = false;
  }
}



/**
 * @unrestricted
 * @extends {DataGridImpl<!NODE_TYPE>}
 * @template NODE_TYPE
 */
class ViewportDataGrid extends DataGridImpl {
  /**
   * @param {!DataGrid.Parameters} dataGridParameters
   */
  constructor(dataGridParameters) {
    super(dataGridParameters);

    this._onScrollBound = this._onScroll.bind(this);
    this.scrollContainer.addEventListener('scroll', this._onScrollBound, true);

    /** @type {!Array.<!ViewportDataGridNode>} */
    this._visibleNodes = [];
    /**
     * @type {boolean}
     */
    this._inline = false;

    this._stickToBottom = false;
    this._updateIsFromUser = false;
    this._lastScrollTop = 0;
    this._firstVisibleIsStriped = false;
    this._isStriped = false;

    this.setRootNode(new ViewportDataGridNode());
  }

  /**
   * @param {boolean} striped
   * @override
   */
  setStriped(striped) {
    this._isStriped = striped;
    let startsWithOdd = true;
    if (this._visibleNodes.length) {
      const allChildren = this.rootNode().flatChildren();
      startsWithOdd = !!(allChildren.indexOf(this._visibleNodes[0]));
    }
    this._updateStripesClass(startsWithOdd);
  }

  /**
   * @param {boolean} startsWithOdd
   */
  _updateStripesClass(startsWithOdd) {
    this.element.classList.toggle('striped-data-grid', !startsWithOdd && this._isStriped);
    this.element.classList.toggle('striped-data-grid-starts-with-odd', startsWithOdd && this._isStriped);
  }

  /**
   * @param {!Element} scrollContainer
   */
  setScrollContainer(scrollContainer) {
    this.scrollContainer.removeEventListener('scroll', this._onScrollBound, true);
    /**
     * @suppress {accessControls}
     */
    this._scrollContainer = scrollContainer;
    this.scrollContainer.addEventListener('scroll', this._onScrollBound, true);
  }

  /**
   * @override
   */
  onResize() {
    if (this._stickToBottom) {
      this.scrollContainer.scrollTop = this.scrollContainer.scrollHeight - this.scrollContainer.clientHeight;
    }
    this.scheduleUpdate();
    super.onResize();
  }

  /**
   * @param {boolean} stick
   */
  setStickToBottom(stick) {
    this._stickToBottom = stick;
  }

  /**
   * @param {?Event} event
   */
  _onScroll(event) {
    this._stickToBottom = this.scrollContainer.isScrolledToBottom();
    if (this._lastScrollTop !== this.scrollContainer.scrollTop) {
      this.scheduleUpdate(true);
    }
  }

  /**
   * @protected
   */
  scheduleUpdateStructure() {
    this.scheduleUpdate();
  }

  /**
   * @param {boolean=} isFromUser
   */
  scheduleUpdate(isFromUser) {
    if (this._stickToBottom && isFromUser) {
      this._stickToBottom = this.scrollContainer.isScrolledToBottom();
    }
    this._updateIsFromUser = this._updateIsFromUser || isFromUser;
    if (this._updateAnimationFrameId) {
      return;
    }
    this._updateAnimationFrameId = this.element.window().requestAnimationFrame(this._update.bind(this));
  }

  // TODO(allada) This should be fixed to never be needed. It is needed right now for network because removing
  // elements happens followed by a scheduleRefresh() which causes white space to be visible, but the waterfall
  // updates instantly.
  updateInstantly() {
    this._update();
  }

  /**
   * @override
   */
  renderInline() {
    this._inline = true;
    super.renderInline();
    this._update();
  }

  /**
   * @param {number} clientHeight
   * @param {number} scrollTop
   * @return {{topPadding: number, bottomPadding: number, contentHeight: number, visibleNodes: !Array.<!ViewportDataGridNode>, offset: number}}
   */
  _calculateVisibleNodes(clientHeight, scrollTop) {
    const nodes = this.rootNode().flatChildren();
    if (this._inline) {
      return {topPadding: 0, bottomPadding: 0, contentHeight: 0, visibleNodes: nodes, offset: 0};
    }

    const size = nodes.length;
    let i = 0;
    let y = 0;

    for (; i < size && y + nodes[i].nodeSelfHeight() < scrollTop; ++i) {
      y += nodes[i].nodeSelfHeight();
    }
    const start = i;
    const topPadding = y;

    for (; i < size && y < scrollTop + clientHeight; ++i) {
      y += nodes[i].nodeSelfHeight();
    }
    const end = i;

    let bottomPadding = 0;
    for (; i < size; ++i) {
      bottomPadding += nodes[i].nodeSelfHeight();
    }

    return {
      topPadding: topPadding,
      bottomPadding: bottomPadding,
      contentHeight: y - topPadding,
      visibleNodes: nodes.slice(start, end),
      offset: start
    };
  }

  /**
   * @return {number}
   */
  _contentHeight() {
    const nodes = this.rootNode().flatChildren();
    let result = 0;
    for (let i = 0, size = nodes.length; i < size; ++i) {
      result += nodes[i].nodeSelfHeight();
    }
    return result;
  }

  _update() {
    if (this._updateAnimationFrameId) {
      this.element.window().cancelAnimationFrame(this._updateAnimationFrameId);
      delete this._updateAnimationFrameId;
    }

    const clientHeight = this.scrollContainer.clientHeight;
    let scrollTop = this.scrollContainer.scrollTop;
    const currentScrollTop = scrollTop;
    const maxScrollTop = Math.max(0, this._contentHeight() - clientHeight);
    if (!this._updateIsFromUser && this._stickToBottom) {
      scrollTop = maxScrollTop;
    }
    this._updateIsFromUser = false;
    scrollTop = Math.min(maxScrollTop, scrollTop);

    const viewportState = this._calculateVisibleNodes(clientHeight, scrollTop);
    const visibleNodes = viewportState.visibleNodes;
    const visibleNodesSet = new Set(visibleNodes);

    for (let i = 0; i < this._visibleNodes.length; ++i) {
      const oldNode = this._visibleNodes[i];
      if (!visibleNodesSet.has(oldNode) && oldNode.attached()) {
        const element = oldNode.existingElement();
        element.remove();
      }
    }

    let previousElement = this.topFillerRowElement();
    const tBody = this.dataTableBody;
    let offset = viewportState.offset;

    if (visibleNodes.length) {
      const nodes = this.rootNode().flatChildren();
      const index = nodes.indexOf(visibleNodes[0]);
      this._updateStripesClass(!!(index % 2));
      if (this._stickToBottom && index !== -1 && !!(index % 2) !== this._firstVisibleIsStriped) {
        offset += 1;
      }
    }

    this._firstVisibleIsStriped = !!(offset % 2);

    for (let i = 0; i < visibleNodes.length; ++i) {
      const node = visibleNodes[i];
      const element = node.element();
      node.setStriped((offset + i) % 2 === 0);
      if (element !== previousElement.nextSibling) {
        tBody.insertBefore(element, previousElement.nextSibling);
      }
      node.revealed = true;
      previousElement = element;
    }

    this.setVerticalPadding(viewportState.topPadding, viewportState.bottomPadding);
    this._lastScrollTop = scrollTop;
    if (scrollTop !== currentScrollTop) {
      this.scrollContainer.scrollTop = scrollTop;
    }
    const contentFits =
      viewportState.contentHeight <= clientHeight && viewportState.topPadding + viewportState.bottomPadding === 0;
    if (contentFits !== this.element.classList.contains('data-grid-fits-viewport')) {
      this.element.classList.toggle('data-grid-fits-viewport', contentFits);
      this.updateWidths();
    }
    this._visibleNodes = visibleNodes;
    this.dispatchEventToListeners(Events.ViewportCalculated);
  }

  /**
   * @param {!ViewportDataGridNode} node
   */
  _revealViewportNode(node) {
    const nodes = this.rootNode().flatChildren();
    const index = nodes.indexOf(node);
    if (index === -1) {
      return;
    }
    let fromY = 0;
    for (let i = 0; i < index; ++i) {
      fromY += nodes[i].nodeSelfHeight();
    }
    const toY = fromY + node.nodeSelfHeight();

    let scrollTop = this.scrollContainer.scrollTop;
    if (scrollTop > fromY) {
      scrollTop = fromY;
      this._stickToBottom = false;
    } else if (scrollTop + this.scrollContainer.offsetHeight < toY) {
      scrollTop = toY - this.scrollContainer.offsetHeight;
    }
    this.scrollContainer.scrollTop = scrollTop;
  }
}

/**
 * @override @suppress {checkPrototypalTypes} @enum {symbol}
 */
/*export const Events = {
  ViewportCalculated: Symbol('ViewportCalculated')
};*/

/**
 * @unrestricted
 * @extends {DataGridNode<!NODE_TYPE>}
 * @template NODE_TYPE
 */
class ViewportDataGridNode extends DataGridNode {
  /**
   * @param {?Object.<string, *>=} data
   * @param {boolean=} hasChildren
   */
  constructor(data, hasChildren) {
    super(data, hasChildren);
    /** @type {boolean} */
    this._stale = false;
    /** @type {?Array<!ViewportDataGridNode>} */
    this._flatNodes = null;
    this._isStriped = false;
  }

  /**
   * @override
   * @return {!Element}
   */
  element() {
    const existingElement = this.existingElement();
    const element = existingElement || this.createElement();
    if (!existingElement || this._stale) {
      this.createCells(element);
      this._stale = false;
    }
    return element;
  }

  /**
   * @param {boolean} isStriped
   */
  setStriped(isStriped) {
    this._isStriped = isStriped;
    this.element().classList.toggle('odd', isStriped);
  }

  /**
   * @return {boolean}
   */
  isStriped() {
    return this._isStriped;
  }

  /**
   * @protected
   */
  clearFlatNodes() {
    this._flatNodes = null;
    const parent = /** @type {!ViewportDataGridNode} */ (this.parent);
    if (parent) {
      parent.clearFlatNodes();
    }
  }

  /**
   * @return {!Array<!ViewportDataGridNode>}
   */
  flatChildren() {
    if (this._flatNodes) {
      return this._flatNodes;
    }
    /** @type {!Array<!ViewportDataGridNode>} */
    const flatNodes = [];
    /** @type {!Array<!Array<!ViewportDataGridNode>>} */
    const children = [this.children];
    /** @type {!Array<number>} */
    const counters = [0];
    let depth = 0;
    while (depth >= 0) {
      if (children[depth].length <= counters[depth]) {
        depth--;
        continue;
      }
      const node = children[depth][counters[depth]++];
      flatNodes.push(node);
      if (node.expanded && node.children.length) {
        depth++;
        children[depth] = node.children;
        counters[depth] = 0;
      }
    }

    this._flatNodes = flatNodes;
    return flatNodes;
  }

  /**
   * @override
   * @param {!NODE_TYPE} child
   * @param {number} index
   */
  insertChild(child, index) {
    this.clearFlatNodes();
    if (child.parent === this) {
      const currentIndex = this.children.indexOf(child);
      if (currentIndex < 0) {
        console.assert(false, 'Inconsistent DataGrid state');
      }
      if (currentIndex === index) {
        return;
      }
      if (currentIndex < index) {
        --index;
      }
    }
    child.remove();
    child.parent = this;
    child.dataGrid = this.dataGrid;
    if (!this.children.length) {
      this.setHasChildren(true);
    }
    this.children.splice(index, 0, child);
    child.recalculateSiblings(index);
    if (this.expanded) {
      this.dataGrid.scheduleUpdateStructure();
    }
  }

  /**
   * @override
   * @param {!NODE_TYPE} child
   */
  removeChild(child) {
    this.clearFlatNodes();
    if (this.dataGrid) {
      this.dataGrid.updateSelectionBeforeRemoval(child, false);
    }
    if (child.previousSibling) {
      child.previousSibling.nextSibling = child.nextSibling;
    }
    if (child.nextSibling) {
      child.nextSibling.previousSibling = child.previousSibling;
    }
    if (child.parent !== this) {
      throw 'removeChild: Node is not a child of this node.';
    }

    this.children.remove(child, true);
    child._unlink();

    if (!this.children.length) {
      this.setHasChildren(false);
    }
    if (this.expanded) {
      this.dataGrid.scheduleUpdateStructure();
    }
  }

  /**
   * @override
   */
  removeChildren() {
    this.clearFlatNodes();
    if (this.dataGrid) {
      this.dataGrid.updateSelectionBeforeRemoval(this, true);
    }
    for (let i = 0; i < this.children.length; ++i) {
      this.children[i]._unlink();
    }
    this.children = [];

    if (this.expanded) {
      this.dataGrid.scheduleUpdateStructure();
    }
  }

  _unlink() {
    if (this.attached()) {
      this.existingElement().remove();
    }
    this.resetNode();
  }

  /**
   * @override
   */
  collapse() {
    if (!this.expanded) {
      return;
    }
    this.clearFlatNodes();
    /**
     * @suppress {accessControls}
     */
    this._expanded = false;
    if (this.existingElement()) {
      this.existingElement().classList.remove('expanded');
    }
    if (this.selected) {
      //this.dataGrid.updateGridAccessibleName(/* text */ ls`collapsed`);
    }
    this.dataGrid.scheduleUpdateStructure();
  }

  /**
   * @override
   */
  expand() {
    if (this.expanded) {
      return;
    }
    this.dataGrid._stickToBottom = false;
    this.clearFlatNodes();
    super.expand();
    this.dataGrid.scheduleUpdateStructure();
  }

  /**
   * @protected
   * @return {boolean}
   */
  attached() {
    return !!(this.dataGrid && this.existingElement() && this.existingElement().parentElement);
  }

  /**
   * @override
   */
  refresh() {
    if (this.attached()) {
      this._stale = true;
      this.dataGrid.scheduleUpdate();
    } else {
      this.resetElement();
    }
  }

  /**
   * @override
   */
  reveal() {
    this.dataGrid._revealViewportNode(this);
  }

  /**
   * @override
   * @param {number} index
   */
  recalculateSiblings(index) {
    this.clearFlatNodes();
    super.recalculateSiblings(index);
  }
}




/**
 * @unrestricted
 * @extends {ViewportDataGrid<!NODE_TYPE>}
 * @template NODE_TYPE
 */
class SortableDataGrid extends ViewportDataGrid {
  /**
   * @param {!DataGrid.Parameters} dataGridParameters
   */
  constructor(dataGridParameters) {
    super(dataGridParameters);
    /** @type {function(!NODE_TYPE, !NODE_TYPE):number} */
    this._sortingFunction = SortableDataGrid.TrivialComparator;
    this.setRootNode(/** @type {!SortableDataGridNode<!NODE_TYPE>} */ (new SortableDataGridNode()));
  }

  /**
   * @param {!SortableDataGridNode} a
   * @param {!DataGrid.SortableDataGridNode} b
   * @return {number}
   */
  static TrivialComparator(a, b) {
    return 0;
  }

  /**
   * @param {string} columnId
   * @param {!SortableDataGridNode} a
   * @param {!DataGrid.SortableDataGridNode} b
   * @return {number}
   */
  static NumericComparator(columnId, a, b) {
    const aValue = a.data[columnId];
    const bValue = b.data[columnId];
    const aNumber = Number(aValue instanceof Node ? aValue.textContent : aValue);
    const bNumber = Number(bValue instanceof Node ? bValue.textContent : bValue);
    return aNumber < bNumber ? -1 : (aNumber > bNumber ? 1 : 0);
  }

  /**
   * @param {string} columnId
   * @param {!SortableDataGridNode} a
   * @param {!DataGrid.SortableDataGridNode} b
   * @return {number}
   */
  static StringComparator(columnId, a, b) {
    const aValue = a.data[columnId];
    const bValue = b.data[columnId];
    const aString = aValue instanceof Node ? aValue.textContent : String(aValue);
    const bString = bValue instanceof Node ? bValue.textContent : String(bValue);
    return aString < bString ? -1 : (aString > bString ? 1 : 0);
  }

  /**
   * @param {function(!NODE_TYPE, !NODE_TYPE):number} comparator
   * @param {boolean} reverseMode
   * @param {!NODE_TYPE} a
   * @param {!NODE_TYPE} b
   * @return {number}
   * @template NODE_TYPE
   */
  static Comparator(comparator, reverseMode, a, b) {
    return reverseMode ? comparator(b, a) : comparator(a, b);
  }

  /**
   * @param {!Array.<string>} columnNames
   * @param {!Array.<string>} values
   * @param {string} displayName
   * @return {?SortableDataGrid<!SortableDataGridNode>}
   */
  static create(columnNames, values, displayName) {
    const numColumns = columnNames.length;
    if (!numColumns) {
      return null;
    }

    const columns = /** @type {!Array<!DataGrid.ColumnDescriptor>} */ ([]);
    for (let i = 0; i < columnNames.length; ++i) {
      columns.push({id: String(i), title: columnNames[i], width: columnNames[i].length, sortable: true});
    }

    const nodes = [];
    for (let i = 0; i < values.length / numColumns; ++i) {
      const data = {};
      for (let j = 0; j < columnNames.length; ++j) {
        data[j] = values[numColumns * i + j];
      }

      const node = new SortableDataGridNode(data);
      node.selectable = false;
      nodes.push(node);
    }

    const dataGrid = new SortableDataGrid({displayName, columns});
    const length = nodes.length;
    const rootNode = dataGrid.rootNode();
    for (let i = 0; i < length; ++i) {
      rootNode.appendChild(nodes[i]);
    }

    dataGrid.addEventListener(Events.SortingChanged, sortDataGrid);

    function sortDataGrid() {
      const nodes = dataGrid.rootNode().children;
      const sortColumnId = dataGrid.sortColumnId();
      if (!sortColumnId) {
        return;
      }

      let columnIsNumeric = true;
      for (let i = 0; i < nodes.length; i++) {
        const value = nodes[i].data[sortColumnId];
        if (isNaN(value instanceof Node ? value.textContent : value)) {
          columnIsNumeric = false;
          break;
        }
      }

      const comparator = columnIsNumeric ? SortableDataGrid.NumericComparator : SortableDataGrid.StringComparator;
      dataGrid.sortNodes(comparator.bind(null, sortColumnId), !dataGrid.isSortOrderAscending());
    }
    return dataGrid;
  }

  /**
   * @param {!NODE_TYPE} node
   */
  insertChild(node) {
    const root = /** @type {!SortableDataGridNode<!NODE_TYPE>} */ (this.rootNode());
    root.insertChildOrdered(node);
  }

  /**
   * @param {function(!NODE_TYPE, !NODE_TYPE):number} comparator
   * @param {boolean} reverseMode
   */
  sortNodes(comparator, reverseMode) {
    this._sortingFunction = SortableDataGrid.Comparator.bind(null, comparator, reverseMode);
    this.rootNode().recalculateSiblings(0);
    this.rootNode()._sortChildren(reverseMode);
    this.scheduleUpdateStructure();
  }
}

/**
 * @unrestricted
 * @extends {ViewportDataGridNode<!NODE_TYPE>}
 * @template NODE_TYPE
 */
class SortableDataGridNode extends ViewportDataGridNode {
  /**
   * @param {?Object.<string, *>=} data
   * @param {boolean=} hasChildren
   */
  constructor(data, hasChildren) {
    super(data, hasChildren);
  }

  /**
   * @param {!NODE_TYPE} node
   */
  insertChildOrdered(node) {
    this.insertChild(node, this.children.upperBound(node, this.dataGrid._sortingFunction));
  }

  _sortChildren() {
    this.children.sort(this.dataGrid._sortingFunction);
    for (let i = 0; i < this.children.length; ++i) {
      this.children[i].recalculateSiblings(i);
    }
    for (const child of this.children) {
      child._sortChildren();
    }
  }
}


exports.Events = Events;
exports.SortableDataGrid = SortableDataGrid;
exports.SortableDataGridNode = SortableDataGridNode;

