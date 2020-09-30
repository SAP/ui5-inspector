const ODataNode = require('./ODataNode.js');
const multipartmixed2har = require('./multipartmixed2har.js');
const formatXML = require('prettify-xml');

function EntryLog () {
    this.oEditorContent = {};
    this.oNoResponseMessage = {};
    this._index = 0;
};

EntryLog.prototype.getEntryNode = function(entry) {
    let oNode,
        aNodes = [];
    const odataVersion = entry.response.headers.find(el => el.name.toLowerCase() === 'odata-version' || el.name.toLowerCase() === 'dataserviceversion'),
        self = this;

    if (odataVersion && (
        odataVersion.value === '4.0' ||
        odataVersion.value === '3.0' ||
        odataVersion.value === '2.0'
    )) {
        const contentIndex = this.nextIndex(),
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
                note: `${this.formatDateTime(entry.startedDateTime)} : ${this.formatDuration(entry.time)} ms`,
                isBatch: bIsBatch
            };
        bIsBatch && (options.classes += " batch");
        oNode = this.createNode(options);

        if (entry.response.content.mimeType.includes("application/xml")) {
            multipartmixed2har.getContent(entry).then(function(content) {
                self.oEditorContent[contentIndex] = { type: 'xml', content: formatXML(content) };
            });
        } else if (bIsBatch) {
            const serviceUrl = entry.request.url.split('$batch')[0];
            multipartmixed2har.extractMultipartEntry(entry).then(function(childEntries) {
                aNodes = self.showEmbeddedRequests(childEntries, serviceUrl);
                self.oNoResponseMessage[contentIndex] = "See the split responses of this batch request";
                aNodes.forEach(function(oChildNode) {
                    oNode.appendChild(oChildNode);
                })
            });

        } else if (entry.response.content.mimeType.includes("application/json")) {
            //remove stuff that is not interesting here
            delete entry._initiator;
            multipartmixed2har.getContent(entry).then(function(content) {
                entry.response._content = JSON.parse(content || '{}');
                self.oEditorContent[contentIndex] = { type: 'json', content: JSON.stringify(entry, null, 2) };
            });
        } else if (entry.response.content.mimeType.includes("text/plain")) {
            multipartmixed2har.getContent(entry).then(function(content) {
                self.oEditorContent[contentIndex] = { type: 'text', content: content }
            });
        }
    } else if (entry.response.status > 299 && entry.response.content.mimeType.includes("application/xml")) {
        //Potential OData Server Errors
        const contentIndex = this.nextIndex(),
            options = {
                id: contentIndex,
                classes: "clickable error",
                url: entry.request.url,
                status: entry.response.status,
                method: entry.request.method,
                note: `${entry.startedDateTime}: ${entry.time} ms`
            },
            oNode = this.createNode(options);
            multipartmixed2har.getContent(entry).then(function(content) {
                self.oEditorContent[contentIndex] = { type: 'xml', content: formatXML(content) };
            });
    } else if (entry._error === "net::ERR_CONNECTION_REFUSED") {
        const contentIndex = this.nextIndex(),
            options = {
            classes: "error",
            url: entry.request.url,
            status: entry.response.status,
            method: entry.request.method
        };
        oNode = this.createNode(options);
        this.oNoResponseMessage[contentIndex] = "Check if the server went down or the network was interrupted";
    }

    return oNode;
};

EntryLog.prototype.showEmbeddedRequests = function (entries, serviceUrl, prefix) {
    return entries.map(entry => {
        if (entry.children) {
            return this.showEmbeddedRequests(entry.children, serviceUrl, entry.changeset);
        } else {
            const contentIndex = this.nextIndex(),
                classes = 'clickable secondLevel' +
                    //Mark errors
                    (entry.response && entry.response.status > 299 && ' error' || '' );

            this.oEditorContent[contentIndex] = { type: 'json', content: JSON.stringify(entry, null, 2) };
            const options = {
                id: contentIndex,
                classes: classes,
                url: `${prefix ? prefix +  '-> ' : ''} ${entry.request.url}`,
                status: entry.response.status,
                method: entry.request.method,
                note: `${entry.response.headers.location ? '<br/>&nbsp;&nbsp; -> ' + entry.response.headers.location : ""}`
            };

            return this.createNode(options);
        }
    }, this);
}

EntryLog.prototype.formatDateTime = function (x) {
    return x.match(/.+T(.+)Z/).pop();
};

EntryLog.prototype.formatDuration = function (x) {
    return x.toPrecision(7);
};

EntryLog.prototype.nextIndex = function() {
    return this._index++;
}

EntryLog.prototype.createNode = function (options) {
    options.name = options.url.split("/").pop();

    return new ODataNode(options);
};

EntryLog.prototype.getEditorContent = function (iSelectedId) {
    return this.oEditorContent[iSelectedId];
};

EntryLog.prototype.getNoResponseMessage = function (iSelectedId) {
    return this.oNoResponseMessage[iSelectedId];
};


module.exports = EntryLog;
