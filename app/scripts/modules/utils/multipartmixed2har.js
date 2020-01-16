const unpopularLines = (line) => !(line.includes('application/http') || line === "" || line.includes("Content-Transfer-Encoding"))

const createResponse = (resPart) => {
    if (resPart.includes("boundary=changeset")) {
        let sBoundary = resPart.match(/boundary=(.*)/)[1],
            res = {
                changeset: sBoundary,
                children: resPart.split( '--' + sBoundary)
                    .filter(line => line.trim() !== '--' && !line.includes(sBoundary))
                    .map(createResponse)
            }
        return res
    } else {
        let lines = resPart.split('\n'), res = {
            headers: {}
        }
        lines.filter(unpopularLines).forEach(line => {
            line = line.trim()
            if (line.indexOf('HTTP/1.1') === 0) {
                let statusLine = line.substr(9)
                res.status = parseInt(statusLine)
                res.statusText = statusLine.substr(3)
            } else if (line.indexOf('{') === 0) {
                try {
                    res.body = JSON.parse(line)
                } catch (e) {
                    res.body = { parseError: 'invalid JSON' }
                }
            } else if (line) {
                let [name, value] = line.split(/:(.+)/)
                if (name.toLowerCase() === "sap-messages") {
                    value = JSON.parse(value)
                }
                res.headers[name] = value
            }
        })
        return res
    }
}

const createRequest = (reqPart) => {
    if (reqPart.includes("boundary=changeset")) {
        let sBoundary = reqPart.match(/boundary=(.*)/)[1],
            request = {
                changeset: sBoundary,
                children: reqPart.split( '--' + sBoundary)
                    .filter(line => line.trim() !== '--' && !line.includes(sBoundary))
                    .map(createRequest)
            }
        return request
    } else {
        let request = {
            headers: {}
        }
        reqPart.split('\n').filter(unpopularLines).forEach(line => {
            line = line.trim()
            if (line.match("(GET|POST|PATCH|PUT|DELETE).*")) {
                let [method, url, httpVersion] = line.split(" ")
                request.method = method
                request.url = url
                request.httpVersion = httpVersion
            } else if (line.indexOf('{') === 0) {
                try {
                    request.body = JSON.parse(line)
                } catch (e) {
                    request.body = { parseError: 'invalid JSON' }
                }
            } else if (line) {
                let [name, value] = line.split(/:(.+)/)
                if (name.toLowerCase() === "sap-messages") {
                    value = JSON.parse(value)
                }
                request.headers[name] = value
            }
        })
        return request
    }
}

const transformIfChildren = (entry) => {
    if (entry.request.children) {
        entry.changeset = entry.request.changeset
        entry.children = entry.request.children.map((request, ind) => ({
            request: request,
            response: entry.response.children[ind]
        }))
        delete entry.response
        delete entry.request
    }
    return entry
}

const removeEmplyLinesFilter = (x) => {
    var xm = x.replace(/\s\n/, "");
    return !!xm.length;
}

const parseBlock = (requestsRaw, responseRaw) => {
    let responses = responseRaw.map(createResponse)
    return requestsRaw.map((reqPart, ind) => transformIfChildren({
            request: createRequest(reqPart),
            response: responses[ind]
        })
    )
}

// requestsRaw.filter(raw => raw.includes("boundary=changeset")).map(raw => {
//     let reqBoundary =
// })
const deMultipart = async (content, req, res) => {
    return Promise.resolve().then(() => {
        let raw = atob(content),
            reqBoundary = '--' + req.postData.mimeType.split('boundary=')[1],
            resContentType = res.headers.find(header => header.name.toLowerCase() === "content-type").value,
            resBoundary = '--' + resContentType.split('boundary=')[1],
            requestsRaw = req.postData.text.split(reqBoundary).filter(line => line.trim() !== '--' && line !== "").filter(removeEmplyLinesFilter),
            responseRaw = raw.split(resBoundary).filter(line => line.trim() !== '--' && line !== "").filter(removeEmplyLinesFilter);
        return parseBlock(requestsRaw, responseRaw)
    })
}

const getContent = async (entry) =>
    Promise.resolve(new Promise((resolve) => {
        entry.getContent(content => resolve(content))
    }));

exports.getContent = getContent;

/**
 * extracts the content of multipart/mixed request response pairs and creates them as childEntries
 * childEntries should follow the har spec of entries as far as possilbe
 */
exports.extractMultipartEntry = async (entry) =>
    entry.childEntries = await deMultipart(await getContent(entry), entry.request, entry.response)



exports.extractMultipartEntries = async (entries) => {
    await entries.forEach(extractMultipartEntry)
}

// export {extractMultipartEntries, extractMultipartEntry}
