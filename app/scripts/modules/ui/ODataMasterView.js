const DataGrid = require('./datagrid/DataGrid.js');
const UIUtils = require('./datagrid/UIUtils.js');
const multipartmixed2har = require('../utils/multipartmixed2har.js');


const COLUMNS = [{
    id: "name",
    title: "Name",
    sortable: true,
    align: undefined,
    nonSelectable: false,
    weight: 40,
    visible: true,
    allowInSortByEvenWhenHidden: false,
    disclosure: true,
    sortingFunction: function (a, b) {
        return DataGrid.SortableDataGrid.StringComparator("name", a, b);
    }
},
    {
        id: "method",
        title: "Method",
        sortable: true,
        align: undefined,
        nonSelectable: false,
        weight: 10,
        visible: true,
        allowInSortByEvenWhenHidden: false,
        sortingFunction: function (a, b) {
            return DataGrid.SortableDataGrid.StringComparator("method", a, b);
        }
    },
    {
        id: "status",
        title: "Status",
        sortable: true,
        align: undefined,
        nonSelectable: false,
        weight: 10,
        visible: true,
        allowInSortByEvenWhenHidden: false,
        sortingFunction: function (a, b) {
            return DataGrid.SortableDataGrid.NumericComparator("status", a, b);
        }
    },
    {
        id: "note",
        title: "Detail",
        sortable: true,
        align: undefined,
        nonSelectable: false,
        weight: 20,
        visible: true,
        allowInSortByEvenWhenHidden: false,
        sortingFunction: function (a, b) {
            return DataGrid.SortableDataGrid.StringComparator("note", a, b);
        }
    }];


class ODataNode extends DataGrid.SortableDataGridNode {
    constructor(data) {
        super(data);
    }

    createCell(columnId) {
        const cell = super.createCell(columnId);
        if (columnId === 'name') {
            this._renderPrimaryCell(cell, columnId);
        }

        return cell;
    }

    _renderPrimaryCell(cell, columnId, text) {
        let iconElement = createElementWithClass('span', 'icon'),
            iSymbol = (this.data.isBatch) ? 128194 : 128463,
            sClass = (this.data.isBatch) ? "batchIcon" : "requestIcon";

        iconElement.classList.add(sClass);
        iconElement.innerHTML = `&#${iSymbol}`;
        cell.prepend(iconElement);

        cell.title = this.data.url;
    }
}


var _index = 0;
const nextIndex = () => _index++;
const editorContent = {};
const noResponseMessage = {};


const createNode = (options) => {
    options.name = options.url.split("/").pop();
    return new ODataNode(options);
};


const showEmbeddedRequests = (entries, serviceUrl, prefix) => entries.map(entry => {
    if (entry.children) {
        return showEmbeddedRequests(entry.children, serviceUrl, entry.changeset)
    } else {
        const contentIndex = nextIndex(),
            classes = 'clickable secondLevel' +
                //Mark errors
                ( entry.response && entry.response.status > 299 && ' error' || '' ),
            link = entry.request.method === "GET" && `<a href="${serviceUrl}${entry.request.url}" target="_blank"> Open in new Window</a>` || ''
        editorContent[contentIndex] = { type: 'json', content: JSON.stringify(entry, null, 2) };
        var options = {
            id: contentIndex,
            classes: classes,
            url: `${prefix ? prefix +  '-> ' : ''} ${entry.request.url}`,
            status: entry.response.status,
            method: entry.request.method,
            note: `${entry.response.headers.location ? '<br/>&nbsp;&nbsp; -> ' + entry.response.headers.location : ""}`
        };
        return createNode(options);
    }
});

const formatDateTime = (x) => {
    return x.match(/.+T(.+)Z/).pop();
};

const formatDuration = (x) => {
    return x.toPrecision(7);
};


function ODataMasterView(domId, options) {

    this.oContainerDOM = document.getElementById(domId);

    this.onSelectItem = function(oSelectedData) {};
    this.onClearItems = function(oSelectedData) {};
    if (options) {
        this.onSelectItem = options.onSelectItem || this.onSelectItem;
        this.onClearItems = options.onClearItems || this.onClearItems;
    }


    var oClearButton = this._createClearButton();
    this.oContainerDOM.appendChild(oClearButton);


    this.oDataGrid = this._createDataGrid();
    this.oContainerDOM.appendChild(this.oDataGrid.element);


    chrome.devtools.network.getHAR(async function (result) {

        var entries = result.entries;
        if (!entries.length) {
            console.warn("No requests found by now");
        }
        entries.forEach(this._logEntry.bind(this));
        chrome.devtools.network.onRequestFinished.addListener(this._logEntry.bind(this));
    }.bind(this));

}

ODataMasterView.prototype._createClearButton = function() {
    var oIcon = UIUtils.Icon.create('', 'toolbar-glyph hidden');
    oIcon.setIconType("largeicon-clear");

    oIcon.onclick = function() {
        this.oDataGrid.rootNode().removeChildren();
        this.onClearItems();
    }.bind(this);

    return oIcon;
};

ODataMasterView.prototype._createDataGrid = function() {
    var oDataGrid = new DataGrid.SortableDataGrid({
        displayName: "test",
        columns: COLUMNS
    });

    oDataGrid.addEventListener(DataGrid.Events.SortingChanged, this.sortHandler, this);
    oDataGrid.addEventListener(DataGrid.Events.SelectedNode, this.selectHandler, this);

    var oResizeObserver = new ResizeObserver(function(oEntries) {
        oDataGrid.onResize();
    });
    oResizeObserver.observe(oDataGrid.element);

    return oDataGrid;
};

ODataMasterView.prototype.sortHandler = function() {
    const columnId = this.oDataGrid.sortColumnId();
    const columnConfig = COLUMNS.find(columnConfig => columnConfig.id === columnId);
    if (!columnConfig || !columnConfig.sortingFunction) {
        return;
    }
    this.oDataGrid.sortNodes(columnConfig.sortingFunction, !this.oDataGrid.isSortOrderAscending());
};

ODataMasterView.prototype.selectHandler = function(oEvent) {
    var oSelectedNode = oEvent.data,
        iSelectedId = oSelectedNode && oSelectedNode.data.id;
    this.onSelectItem({
        responseBody: editorContent[iSelectedId],
        altMessage: noResponseMessage[iSelectedId]
    });

};

ODataMasterView.prototype._logEntry = function(entry) { // TODO add to a helper class
    const odataVersion = entry.response.headers.find(el => el.name.toLowerCase() === 'odata-version' || el.name.toLowerCase() === 'dataserviceversion')
    var oNode,
        aNodes = [];

    if (odataVersion && (
        odataVersion.value === '4.0' ||
        odataVersion.value === '3.0' ||
        odataVersion.value === '2.0'
    )) {
        const contentIndex = nextIndex(),
            bIsBatch = entry.response.content.mimeType.includes("multipart/mixed"),
            classes = !(
                //They should not be clickable
                entry.request.method === 'HEAD' ||
                bIsBatch
            ) && 'clickable' || '',
            options = {
                id: contentIndex,
                classes: classes,
                url: entry.request.url,
                status: entry.response.status,
                method: entry.request.method,
                note: `${formatDateTime(entry.startedDateTime)} : ${formatDuration(entry.time)} ms`,
                isBatch: bIsBatch
            };
        bIsBatch && (options.classes += " batch");
        oNode = createNode(options);


        if (entry.response.content.mimeType.includes("application/xml")) {
            multipartmixed2har.getContent(entry).then(function(content) {
                editorContent[contentIndex] = { type: 'xml', content: vkbeautify.xml(content) }
            })

        } else if (bIsBatch) {
            const serviceUrl = entry.request.url.split('$batch')[0]
            multipartmixed2har.extractMultipartEntry(entry).then(function(childEntries) {
                aNodes = showEmbeddedRequests(childEntries, serviceUrl);
                noResponseMessage[contentIndex] = "See the split responses of this batch request";
                aNodes.forEach(function(oChildNode) {
                    oNode.appendChild(oChildNode);
                })
            });

        } else if (entry.response.content.mimeType.includes("application/json")) {
            //remove stuff that is not interesting here
            delete entry._initiator;
            multipartmixed2har.getContent(entry).then(function(content) {
                entry.response._content = JSON.parse(content || '{}')
                editorContent[contentIndex] = { type: 'json', content: JSON.stringify(entry, null, 2) }
            });
        } else if (entry.response.content.mimeType.includes("text/plain")) {
            multipartmixed2har.getContent(entry).then(function(content) {
                editorContent[contentIndex] = { type: 'text', content: content }
            });
        }
    } else if (entry.response.status > 299 && entry.response.content.mimeType.includes("application/xml")) {
        //Potential OData Server Errors
        const contentIndex = nextIndex(),
            options = {
                id: contentIndex,
                classes: "clickable error",
                url: entry.request.url,
                status: entry.response.status,
                method: entry.request.method,
                note: `${entry.startedDateTime}: ${entry.time} ms`
            },
            oNode = createNode(options);
            multipartmixed2har.getContent(entry).then(function(content) {
                editorContent[contentIndex] = { type: 'xml', content: vkbeautify.xml(content) }
            });
    } else if (entry._error === "net::ERR_CONNECTION_REFUSED") {
        const contentIndex = nextIndex();
        var options = {
            classes: "error",
            url: entry.request.url,
            status: entry.response.status,
            method: entry.request.method
        };
        oNode = createNode(options);
        noResponseMessage[contentIndex] = "Check if the server went down or the network was interrupted";
    }

    if (oNode) {
        this.oDataGrid.insertChild(oNode);
    }

};


module.exports = ODataMasterView;
