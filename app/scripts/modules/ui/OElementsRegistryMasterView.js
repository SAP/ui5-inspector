const DataGrid = require('./datagrid/DataGrid.js');
const UIUtils = require('./datagrid/UIUtils.js');

const COLUMNS = [{
    id: "type",
    title: "TYPE",
    sortable: true,
    align: undefined,
    nonSelectable: false,
    weight: 30,
    visible: true,
    allowInSortByEvenWhenHidden: false,
    disclosure: true,
    sortingFunction: function (a, b) {
        return DataGrid.SortableDataGrid.StringComparator("type", a, b);
    }
},
    {
        id: "id",
        title: "ID",
        sortable: true,
        align: undefined,
        nonSelectable: false,
        weight: 20,
        visible: true,
        allowInSortByEvenWhenHidden: false,
        sortingFunction: function (a, b) {
            return DataGrid.SortableDataGrid.StringComparator("id", a, b);
        }
    },
    {
        id: "parentId",
        title: "parentId",
        sortable: true,
        align: undefined,
        nonSelectable: false,
        weight: 20,
        visible: true,
        allowInSortByEvenWhenHidden: false,
        sortingFunction: function (a, b) {
            return DataGrid.SortableDataGrid.StringComparator("parentId", a, b);
        }
    },
    {
        id: "aggregation",
        title: "aggregation",
        sortable: true,
        align: undefined,
        nonSelectable: false,
        weight: 10,
        visible: true,
        allowInSortByEvenWhenHidden: false,
        sortingFunction: function (a, b) {
            return DataGrid.SortableDataGrid.StringComparator("aggregation", a, b);
        }
    },
    {
        id: "isRendered",
        title: "isRendered",
        sortable: true,
        align: undefined,
        nonSelectable: false,
        weight: 10,
        visible: true,
        allowInSortByEvenWhenHidden: false,
        sortingFunction: function (a, b) {
            return DataGrid.SortableDataGrid.NumericComparator("isRendered", a, b);
        }
    },
    {
        id: "isControl",
        title: "isControl",
        sortable: true,
        align: undefined,
        nonSelectable: false,
        weight: 10,
        visible: true,
        allowInSortByEvenWhenHidden: false,
        sortingFunction: function (a, b) {
            return DataGrid.SortableDataGrid.NumericComparator("isControl", a, b);
        }
    }];

function OElementsRegistryMasterView(domId, options) {

    this.oContainerDOM = document.getElementById(domId);

    this.onSelectItem = function(oSelectedData) {};
    this.onClearItems = function(oSelectedData) {};
    if (options) {
        this.onSelectItem = options.onSelectItem || this.onSelectItem;
        this.onClearItems = options.onClearItems || this.onClearItems;
    }

    debugger;

    this.oDataGrid = this._createDataGrid();
    this.oContainerDOM.appendChild(this.oDataGrid.element);

    // Register for updates here
}

OElementsRegistryMasterView.prototype.getData = function () {
    return this._data;
};


/**
 * Sets all registered elements.
 * @param {Array} data Array with all registered elements
 * @returns {ElementTable}
 */
OElementsRegistryMasterView.prototype.setData = function (data) {
    var oldData = this.getData();

    if (JSON.stringify(oldData) === JSON.stringify(data)) {
        return;
    }

    this._data = data;

    this._data.forEach(function(oElement) {
        var oNode = new DataGrid.SortableDataGridNode(oElement);

        if (oNode) {
            this.oDataGrid.insertChild(oNode);
        }
    }, this);

    return this;
};


OElementsRegistryMasterView.prototype._createDataGrid = function() {
    const oDataGrid = new DataGrid.SortableDataGrid({
        displayName: "test",
        columns: COLUMNS
    });

    oDataGrid.addEventListener(DataGrid.Events.SortingChanged, this.sortHandler, this);
    oDataGrid.addEventListener(DataGrid.Events.SelectedNode, this.selectHandler, this);

    const oResizeObserver = new ResizeObserver(function(oEntries) {
        oDataGrid.onResize();
    });
    oResizeObserver.observe(oDataGrid.element);

    return oDataGrid;
};

OElementsRegistryMasterView.prototype.sortHandler = function() {
    const columnId = this.oDataGrid.sortColumnId();
    const columnConfig = COLUMNS.find(columnConfig => columnConfig.id === columnId);
    if (!columnConfig || !columnConfig.sortingFunction) {
        return;
    }
    this.oDataGrid.sortNodes(columnConfig.sortingFunction, !this.oDataGrid.isSortOrderAscending());
};

OElementsRegistryMasterView.prototype.selectHandler = function(oEvent) {
    const oSelectedNode = oEvent.data,
        iSelectedId = oSelectedNode && oSelectedNode.data.id;

    this.onSelectItem({
        responseBody: this.oEntryLog.getEditorContent(iSelectedId),
        altMessage: this.oEntryLog.getNoResponseMessage(iSelectedId)
    });

};

module.exports = OElementsRegistryMasterView;
