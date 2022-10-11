/* globals ResizeObserver */

'use strict';

const DataGrid = require('./datagrid/DataGrid.js');
const UIUtils = require('./datagrid/UIUtils.js');
const EntriesLog = require('../utils/EntriesLog.js');

const COLUMNS = [{
    id: 'name',
    title: 'Name',
    sortable: true,
    align: undefined,
    nonSelectable: false,
    weight: 40,
    visible: true,
    allowInSortByEvenWhenHidden: false,
    disclosure: true,
    /**
     * Sorts Items.
     * @param {Object} a
     * @param {Object} b
     */
    sortingFunction: function (a, b) {
        return DataGrid.SortableDataGrid.StringComparator('name', a, b);
    }
},
    {
        id: 'method',
        title: 'Method',
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
            return DataGrid.SortableDataGrid.StringComparator('method', a, b);
        }
    },
    {
        id: 'status',
        title: 'Status',
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
            return DataGrid.SortableDataGrid.NumericComparator('status', a, b);
        }
    },
    {
        id: 'note',
        title: 'Detail',
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
            return DataGrid.SortableDataGrid.StringComparator('note', a, b);
        }
    }];

/**
 * @param {string} domId - id of the DOM container
 * @param {Object} options - initial configuration
 * @constructor
 */
function ODataMasterView(domId, options) {

    this.oContainerDOM = document.getElementById(domId);
    this.oEntriesLog = new EntriesLog();

    /**
     * Selects an OData Entry log item.
     * @param {Object} oSelectedData
     */
    this.onSelectItem = function (oSelectedData) {};
    /**
     * Clears all OData Entry log items.
     * @param {Object} oSelectedData
     */
    this.onClearItems = function (oSelectedData) {};
    if (options) {
        this.onSelectItem = options.onSelectItem || this.onSelectItem;
        this.onClearItems = options.onClearItems || this.onClearItems;
    }

    const oClearButton = this._createClearButton();
    this.oContainerDOM.appendChild(oClearButton);

    this.oDataGrid = this._createDataGrid();
    this.oContainerDOM.appendChild(this.oDataGrid.element);
    this._getHAR();
}

/**
 * Logs OData entry.
 * @param {Object} oEntry - Log entry
 * @private
 */
ODataMasterView.prototype._logEntry = function (oEntry) {
    const oNode = this.oEntriesLog.getEntryNode(oEntry);

    if (oNode) {
        this.oDataGrid.insertChild(oNode);
    }
};

/* jshint ignore:start */
/**
 * Gets HTTP Archive request.
 * @private
 */
ODataMasterView.prototype._getHAR = function () {
    /**
     * Processes the HTTP Archive Requests.
     * @param {Object} result
     */
    chrome.devtools.network.getHAR(result => {
        const entries = result.entries;
        if (!entries.length) {
            console.warn('No requests found by now');
        }
        entries.forEach(this._logEntry, this);
        chrome.devtools.network.onRequestFinished.addListener(this._logEntry.bind(this));
    });
};
/* jshint ignore:end */

/**
 * Creates Clear button.
 * @returns {Object} - Clear button Icon
 * @private
 */
ODataMasterView.prototype._createClearButton = function () {
    const oIcon = UIUtils.Icon.create('', 'toolbar-glyph hidden');
    oIcon.setIconType('largeicon-clear');

    /**
     * Clear Icon click handler.
     */
    oIcon.onclick = function () {
        this.oDataGrid.rootNode().removeChildren();
        this.onClearItems();
    }.bind(this);

    return oIcon;
};

/**
 * Creates DataGrid.
 * @returns {Object} - DataGrid
 * @private
 */
ODataMasterView.prototype._createDataGrid = function () {
    const oDataGrid = new DataGrid.SortableDataGrid({
        displayName: 'test',
        columns: COLUMNS
    });

    oDataGrid.addEventListener(DataGrid.Events.SortingChanged, this.sortHandler, this);
    oDataGrid.addEventListener(DataGrid.Events.SelectedNode, this.selectHandler, this);

    /**
     * Resize Handler for DataGrid.
     */
    const oResizeObserver = new ResizeObserver(function () {
        oDataGrid.onResize();
    });
    oResizeObserver.observe(oDataGrid.element);

    return oDataGrid;
};

/**
 * Sorts Columns of the DataGrid.
 */
ODataMasterView.prototype.sortHandler = function () {
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
 * Selects clicked log entry.
 * @param {Object} oEvent
 */
ODataMasterView.prototype.selectHandler = function (oEvent) {
    const oSelectedNode = oEvent.data;
    const iSelectedId = oSelectedNode && oSelectedNode.data.id;

    this.onSelectItem({
        responseBody: this.oEntriesLog.getEditorContent(iSelectedId),
        altMessage: this.oEntriesLog.getNoResponseMessage(iSelectedId)
    });

};

module.exports = ODataMasterView;
