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
     * Selects an OData Entry log item.
     * @param {Object} oSelectedData
     */
    this.onSelectItem = function (oSelectedData) {};
    if (options) {
        this.onSelectItem = options.onSelectItem || this.onSelectItem;

        this.onInitialRendering = options.onInitialRendering ? options.onInitialRendering : function () {};
        this.onRefreshButtonClicked = options.onRefreshButtonClicked || function () {};
    }

    const oRefreshButton = this._createRefreshButton();
    this.oContainerDOM.appendChild(oRefreshButton);

    this.oDataGrid = this._createDataGrid();
    this.oContainerDOM.appendChild(this.oDataGrid.element);

    // Register for updates here
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
    var oldData = this.getData();

    if (JSON.stringify(oldData) === JSON.stringify(data)) {
        return;
    }

    this._data = data;

    this._data.forEach(function (oElement) {
        var oNode = new DataGrid.SortableDataGridNode(oElement);

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
};

module.exports = OElementsRegistryMasterView;
