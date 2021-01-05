/* globals ResizeObserver */

const DataGrid = require('./datagrid/DataGrid.js');
const UIUtils = require('./datagrid/UIUtils.js');

const COLUMNS = [{
    id: 'type',
    title: 'TYPE',
    sortable: true,
    align: undefined,
    nonSelectable: false,
    weight: 30,
    visible: true,
    allowInSortByEvenWhenHidden: false,
    disclosure: true,
    /**
     * Sorts Items.
     * @param {Object} a
     * @param {Object} b
     */
    sortingFunction: function (a, b) {
        return DataGrid.SortableDataGrid.StringComparator('type', a, b);
    }
},
    {
        id: 'id',
        title: 'ID',
        sortable: true,
        align: undefined,
        nonSelectable: false,
        weight: 20,
        visible: true,
        allowInSortByEvenWhenHidden: false,
        /**
         * Sorts Items.
         * @param {Object} a
         * @param {Object} b
         */
        sortingFunction: function (a, b) {
            return DataGrid.SortableDataGrid.StringComparator('id', a, b);
        }
    },
    {
        id: 'parentId',
        title: 'parentId',
        sortable: true,
        align: undefined,
        nonSelectable: false,
        weight: 20,
        visible: true,
        allowInSortByEvenWhenHidden: false,
        /**
         * Sorts Items.
         * @param {Object} a
         * @param {Object} b
         */
        sortingFunction: function (a, b) {
            return DataGrid.SortableDataGrid.StringComparator('parentId', a, b);
        }
    },
    {
        id: 'aggregation',
        title: 'aggregation',
        sortable: true,
        align: undefined,
        nonSelectable: false,
        weight: 10,
        visible: true,
        allowInSortByEvenWhenHidden: false,
        /**
         * Sorts Items.
         * @param {Object} a
         * @param {Object} b
         */
        sortingFunction: function (a, b) {
            return DataGrid.SortableDataGrid.StringComparator('aggregation', a, b);
        }
    },
    {
        id: 'isRendered',
        title: 'isRendered',
        sortable: true,
        align: undefined,
        nonSelectable: false,
        weight: 10,
        visible: true,
        allowInSortByEvenWhenHidden: false,
        /**
         * Sorts Items.
         * @param {Object} a
         * @param {Object} b
         */
        sortingFunction: function (a, b) {
            return DataGrid.SortableDataGrid.NumericComparator('isRendered', a, b);
        }
    },
    {
        id: 'isControl',
        title: 'isControl',
        sortable: true,
        align: undefined,
        nonSelectable: false,
        weight: 10,
        visible: true,
        allowInSortByEvenWhenHidden: false,
        /**
         * Sorts Items.
         * @param {Object} a
         * @param {Object} b
         */
        sortingFunction: function (a, b) {
            return DataGrid.SortableDataGrid.NumericComparator('isControl', a, b);
        }
    }];

/**
 * @param {string} domId - id of the DOM container
 * @param {Object} options - initial configuration
 * @constructor
 */
function OElementsRegistryMasterView(domId, options) {

    this.oContainerDOM = document.getElementById(domId);

    /**
     * Selects an element.
     * @param {Object} oSelectedData
     */
    this.onSelectItem = function (oSelectedData) {};
    if (options) {
        this.onSelectItem = options.onSelectItem || this.onSelectItem;
        this.onRefreshButtonClicked = options.onRefreshButtonClicked || function () {};
    }

    const oRefreshButton = this._createRefreshButton();
    this.oContainerDOM.appendChild(oRefreshButton);
    this.oContainerDOM.innerHTML += this._createFilter();

    this.oDataGrid = this._createDataGrid();
    this.oContainerDOM.appendChild(this.oDataGrid.element);

    this._setReferences();
    this._createHandlers();
}

/**
 * Creates Refresh button.
 * @returns {Object} - Refresh button Icon
 * @private
 */
OElementsRegistryMasterView.prototype._createRefreshButton = function () {
    const oIcon = UIUtils.Icon.create('', 'toolbar-glyph hidden');
    oIcon.setIconType('largeicon-refresh');

    /**
     * Clear Icon click handler.
     */
    oIcon.onclick = function () {
        this.oDataGrid.rootNode().removeChildren();
        this._data = null;
        this.onRefreshButtonClicked();
    }.bind(this);

    return oIcon;
};

/**
 * Create the HTML needed for filtering.
 * @returns {string}
 * @private
 */
OElementsRegistryMasterView.prototype._createFilter = function () {
    return '<filter>' +
        '<start>' +
        '<input id="elementsRegistrySearch" type="search" placeholder="Search" search/>' +
        '<label><input id="elementsRegistryCheckbox" type="checkbox" filter />Filter results <results id="elementsRegistryResults"></label>' +
        '</start>';
};

/**
 * Create all event handlers for the Search filter.
 * @private
 */
OElementsRegistryMasterView.prototype._createHandlers = function () {
    this._oFilterContainer.onkeyup = this._onSearchInput.bind(this);
    this._oFilterContainer.onsearch = this._onSearchEvent.bind(this);
    this._oFilterCheckBox.onchange = this._onOptionsChange.bind(this);
};

/**
 * Save references of the Search filter elements.
 * @private
 */
OElementsRegistryMasterView.prototype._setReferences = function () {
    this._oFilterContainer = this.oContainerDOM.querySelector('#elementsRegistrySearch');
    this._oFilterCheckBox = this.oContainerDOM.querySelector('#elementsRegistryCheckbox');
    this._oFilterResults = this.oContainerDOM.querySelector('#elementsRegistryResults');
};

/**
 * Event handler for user input in "search" input.
 * @param {Object} event - keyup event
 * @private
 */
OElementsRegistryMasterView.prototype._onSearchInput = function (event) {
    const target = event.target;

    if (target.getAttribute('search') !== null) {
        if (target.value.length !== 0) {
            this._searchElements(target.value);
        } else {
            this._removeAttributesFromSearch('matching');
        }
    }
};

/**
 * Event handler for onsearch event.
 * @param {Object} event - onsearch event
 * @private
 */
OElementsRegistryMasterView.prototype._onSearchEvent = function (event) {
    if (event.target.value.length === 0) {
        this._removeAttributesFromSearch('matching');

        this._oFilterResults.innerHTML = '(0)';
    }
};

/**
 * Event handler for options change of Search filter.
 * @param {Object} event - click event
 * @private
 */
OElementsRegistryMasterView.prototype._onOptionsChange = function (event) {
    const target = event.target;
    const sSearchInput = this._oFilterContainer.value.toLocaleLowerCase();
    let sSelectedNodeId;
    let sId;
    let sType;
    let oNode;

    this._oSelectedNode = this.oDataGrid.selectedNode || this._oSelectedNode;
    sSelectedNodeId =  this._oSelectedNode && this._oSelectedNode._data.id.toLocaleLowerCase();

    if (target.getAttribute('filter') !== null) {
        if (target.checked) {
            this.oContainerDOM.setAttribute('show-filtered-elements', true);
        } else {
            this.oContainerDOM.removeAttribute('show-filtered-elements');
        }
    }

    this.oDataGrid.rootNode().removeChildren();

    if (sSearchInput !== '' && target.checked) {
        this.getData().forEach(function (oElement) {
            sId = oElement.id.toLocaleLowerCase();
            sType = oElement.type.toLocaleLowerCase();

            if ((sId.indexOf(sSearchInput) !== -1 || sType.indexOf(sSearchInput) !== -1)) {
                oNode = new DataGrid.SortableDataGridNode(oElement);

                if (oNode) {
                    this.oDataGrid.insertChild(oNode);

                    if (sSelectedNodeId === sId) {
                        oNode.select();
                    }
                }
            }
        }, this);
    } else {
        this.getData().forEach(function (oElement) {
            oNode = new DataGrid.SortableDataGridNode(oElement);

            if (oNode) {
                this.oDataGrid.insertChild(oNode);

                if (sSelectedNodeId === oElement.id) {
                    oNode.select();
                }
            }
        }, this);
    }
};

/**
 * Search elements that match given criteria.
 * @param {string} sUserInput - Search criteria
 * @private
 */
OElementsRegistryMasterView.prototype._searchElements = function (sUserInput) {
    const aSearchableElements = this.oDataGrid._visibleNodes;
    const sSearchInput = sUserInput.toLocaleLowerCase();
    let sId;
    let sType;

    aSearchableElements.forEach(function (oElement) {
        sId = oElement._data.id.toLocaleLowerCase(),
        sType = oElement._data.type.toLocaleLowerCase();

        if ((sId.indexOf(sSearchInput) !== -1 || sType.indexOf(sSearchInput) !== -1) && sSearchInput !== '') {
            oElement._element.classList.add('matching');
        } else {
            oElement._element.classList.remove('matching');
        }
    });

    this._setResultsCount(sSearchInput);
};

/**
 * Sets search results count.
 * @param {string} sSearchInput - Search criteria
 * @private
 */
OElementsRegistryMasterView.prototype._setResultsCount = function (sSearchInput) {
    let iCount;

    if (sSearchInput === '') {
        iCount = 0;
    } else {
        iCount = this.getData().filter(function (oElement) {
            const sId = oElement.id.toLocaleLowerCase();
            const sType = oElement.type.toLocaleLowerCase();

            if ((sId.indexOf(sSearchInput) !== -1 || sType.indexOf(sSearchInput) !== -1)) {
                return oElement;
            }
        }).length;
    }

    this._oFilterResults.innerHTML = '(' + iCount + ')';
};

/**
 * Remove  "matching" attribute from the search.
 * @private
 */
OElementsRegistryMasterView.prototype._removeAttributesFromSearch = function () {
    const aElements = this.oContainerDOM.querySelectorAll('.matching');

    aElements.forEach(function (oElement) {
        oElement.classList.remove('matching');
    });
};

/**
 * Event handler when elements table is scrolled up/down.
 * @private
 */
OElementsRegistryMasterView.prototype._onViewPortCalculated = function () {
    const sSearchInput = this._oFilterContainer.value;

    this._searchElements(sSearchInput);
};

/**
 * Returns data.
 * @returns {Array} data - elements registry data
 * @private
 */
OElementsRegistryMasterView.prototype.getData = function () {
    return this._data;
};

/**
 * Sets all registered elements.
 * @param {Array} data - Array with all registered elements
 * @returns {ElementTable}
 */
OElementsRegistryMasterView.prototype.setData = function (data) {
    const oldData = this.getData();
    let oNode;

    if (JSON.stringify(oldData) === JSON.stringify(data)) {
        return;
    }

    this._data = data;

    this._data.forEach(function (oElement) {
        oNode = new DataGrid.SortableDataGridNode(oElement);

        if (oNode) {
            this.oDataGrid.insertChild(oNode);
        }
    }, this);

    return this;
};

/**
 * Creates DataGrid.
 * @returns {Object} - DataGrid
 * @private
 */
OElementsRegistryMasterView.prototype._createDataGrid = function () {
    const oDataGrid = new DataGrid.SortableDataGrid({
        displayName: 'test',
        columns: COLUMNS
    });

    oDataGrid.addEventListener(DataGrid.Events.SortingChanged, this.sortHandler, this);
    oDataGrid.addEventListener(DataGrid.Events.SelectedNode, this.selectHandler, this);
    oDataGrid.addEventListener(DataGrid.Events.ViewportCalculated, this._onViewPortCalculated, this);

    /**
     * Resize Handler for DataGrid.
     */
    const oResizeObserver = new ResizeObserver(function (oEntries) {
        oDataGrid.onResize();
    });
    oResizeObserver.observe(oDataGrid.element);

    return oDataGrid;
};

/**
 * Sorts Columns of the DataGrid.
 */
OElementsRegistryMasterView.prototype.sortHandler = function () {
    const columnId = this.oDataGrid.sortColumnId();
    /**
     * Finds Column config by Id.
     * @param {Object} columnConfig
     */
    const columnConfig = COLUMNS.find(columnConfig => columnConfig.id === columnId);
    if (!columnConfig || !columnConfig.sortingFunction) {
        return;
    }
    this.oDataGrid.sortNodes(columnConfig.sortingFunction, !this.oDataGrid.isSortOrderAscending());
};

/**
 * Selects clicked Control.
 * @param {Object} oEvent
 */
OElementsRegistryMasterView.prototype.selectHandler = function (oEvent) {
    this.onSelectItem(oEvent.data._data.id);
    this._sSelectedItem = oEvent.data._data.id;
};

module.exports = OElementsRegistryMasterView;
