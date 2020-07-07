var multipartmixed2har = require('./multipartmixed2har.js');

var _index = 0
const nextIndex = () => _index++
const logArea = document.getElementById('list')
const editor = ace.edit("editor");
const editorDOM = document.getElementById('editor')
const clearButton = document.getElementById('clear')
editor.getSession().setUseWrapMode(true)
const editorContent = {}
const outer = document.getElementById("outer")
const editorAlt = document.querySelector('.editorAlt')
const darkModeMql = matchMedia("(prefers-color-scheme: dark)")
const darkMode = darkModeMql.matches

const keepAtBottom = () => outer.scrollTop = outer.scrollHeight;
const updateEditor = ci => {
    var sResponseBody = editorContent[ci];
    editorDOM.classList.toggle("hidden", !sResponseBody);
    editorAlt.classList.toggle("hidden", sResponseBody);
    if (sResponseBody) {
        editor.session.setMode("ace/mode/" + sResponseBody.type);
        editor.setValue(sResponseBody.content, 0);
    } else {
        editor.setValue("No response body", 0);
    }
    editor.clearSelection()
}

const createRow = (options) => {
    var idstr = (options.id !== null) ? `id="${options.id}"` : "";
    return `<tr class="${options.classes}" ${idstr}><td class="url">${options.url}</td><td class="status">${options.status}</td><td class="method">${options.method}</td><td class="note">${options.note}</td></tr>`;
}
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
        return createRow(options);
        //return `<tr class="${classes}" id="${contentIndex}"><td>${prefix ? prefix +  '-> ' : ''} ${entry.request.url}</td><td>${entry.response.status}</td><td>${entry.request.method}</td><td><p>${entry.response.headers.location ? '<br/>&nbsp;&nbsp; -> ' + entry.response.headers.location : ""}</p></td></tr>`
    }
}).join('\n')


const updateClickHandler = () => {
    let nlist = document.querySelectorAll('#list tr'), elements = [...nlist]
    elements.forEach(el => {
        const id = el.id
        el.addEventListener('click', function () {
            window['splitterRef'].showEndContainer();
            if (id !== null) {
                updateEditor(id)
            }
        }, true)
    })
}

const logEntry = async (entry) => {
    const odataVersion = entry.response.headers.find(el => el.name.toLowerCase() === 'odata-version' || el.name.toLowerCase() === 'dataserviceversion')
    var entryHTML = ''

    if (odataVersion && (
        odataVersion.value === '4.0' ||
        odataVersion.value === '3.0' ||
        odataVersion.value === '2.0'
    )) {
        const contentIndex = nextIndex(),
            classes = !(
                //They should not be clickable
                entry.request.method === 'HEAD' ||
                entry.response.content.mimeType.includes("multipart/mixed")
            ) && 'clickable' || '',
        options = {
            id: contentIndex,
            classes: classes,
            url: entry.request.url,
            status: entry.response.status,
            method: entry.request.method,
            note: `${entry.startedDateTime}: ${entry.time} ms`
        };
        entryHTML = createRow(options);
        //entryHTML = `<tr class="${classes}" id="${contentIndex}"><td>${entry.request.url}</td><td>${entry.response.status}</td><td>${entry.request.method}</td><td><p>${entry.startedDateTime}: ${entry.time} ms</p></td></tr>`;

        if (entry.response.content.mimeType.includes("application/xml")) {
            const content = await multipartmixed2har.getContent(entry)
            editorContent[contentIndex] = { type: 'xml', content: vkbeautify.xml(content) }
            //entryHTML += `<p><a href="${entry.request.url}" target="_blank"> Open in new Window</a></p>` TODO
        } else if (entry.response.content.mimeType.includes("multipart/mixed")) {
            const serviceUrl = entry.request.url.split('$batch')[0]
            const childEntries = await multipartmixed2har.extractMultipartEntry(entry) //await deMultipart(content, entry.request, entry.response)
            entryHTML += showEmbeddedRequests(childEntries, serviceUrl)
        } else if (entry.response.content.mimeType.includes("application/json")) {
            //remove stuff that is not interesting here
            delete entry._initiator
            entry.response._content = JSON.parse(await multipartmixed2har.getContent(entry) || '{}')
            editorContent[contentIndex] = { type: 'json', content: JSON.stringify(entry, null, 2) }
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
         entryHTML = createRow(options);
           // entryHTML = `<tr class="clickable error" id="${contentIndex}"><td>${entry.request.url}</td><td>${entry.response.status}</td><td>${entry.request.method}</td><td><p>${entry.startedDateTime}: ${entry.time} ms</p></td></tr>`,
            content = await multipartmixed2har.getContent(entry)
        editorContent[contentIndex] = { type: 'xml', content: vkbeautify.xml(content) }
    } else if (entry._error === "net::ERR_CONNECTION_REFUSED") {
        var options = {
            classes: "error",
            url: entry.request.url,
            status: entry.response.status,
            method: entry.request.method,
            note: `<p class="error">Check if the server went down or the network was interrupted</p>`
        };
        const entryHTML = createRow(options);
        //const entryHTML = `<tr class="error"><td>${entry.request.url}</td><td>${entry.response.status}</td><td>${entry.request.method}</td><td><p class="error">Check if the server went down or the network was interrupted</p></td></tr>`;
    }
    if (entryHTML) {
        logArea.innerHTML += `${entryHTML}`
        keepAtBottom();
        updateClickHandler();
    }
}

clearButton.onclick = () => {
    logArea.innerHTML = ""
    keepAtBottom();
    updateClickHandler();
    editor.setValue("", -1)
}


const setTheme = (darkMode) => {
    // darkMode = chrome.devtools.panels.themeName === "dark" || darkMode //Hardwired to chrome devtools to dark?
    editor.setTheme(darkMode ? "ace/theme/vibrant_ink" : "ace/theme/chrome")
}
darkModeMql.addListener(event => setTheme(event.matches))
setTheme(darkMode)

chrome.devtools.network.getHAR(async function (result) {

    var entries = result.entries;
    if (!entries.length) {
        console.warn("No requests found by now");
    }
    entries.forEach(logEntry)
    chrome.devtools.network.onRequestFinished.addListener(logEntry)
});
