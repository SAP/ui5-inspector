/**
 * Filters lines we are not interested in.
 * @param {Object} line
 */
const unpopularLines = (line) => !(line.includes('application/http') || line === '' || line.includes('Content-Transfer-Encoding'));

/**
 * Creates response.
 * @param {Object} resPart
 */
const createResponse = (resPart) => {
    if (resPart.includes('boundary=')) {
        const sBoundary = resPart.match(/boundary=(.*)/)[1];
        const res = {
                changeset: sBoundary,
                children: resPart.split( '--' + sBoundary)
                    // jscs:disable
                    .filter(line => !line.startsWith('--') && !line.includes(sBoundary))
                    .map(createResponse)
                    // jscs:enable
            };

        return res;
    } else {
        let lines = resPart.split('\n');
        let res = {
            headers: {}
        };
        // jscs:disable
        lines.filter(unpopularLines).forEach(line => {
        // jscs:enable
            line = line.trim();
            if (line.indexOf('HTTP/1.1') === 0) {
                let statusLine = line.substr(9);
                res.status = parseInt(statusLine);
                res.statusText = statusLine.substr(3);
            } else if (line.indexOf('{') === 0) {
                try {
                    res.body = JSON.parse(line);
                } catch (e) {
                    res.body = {parseError: 'invalid JSON'};
                }
            } else if (line) {
                let [name, value] = line.split(/:(.+)/);
                if (name.toLowerCase() === 'sap-messages') {
                    value = value.trim(' ');

                    // Expecting object or array, otherwise use as string
                    if (value.startsWith('{') || value.startsWith('[')) {
                        value = JSON.parse(value);
                    }
                }
                res.headers[name] = value;
            }
        });

        return res;
    }
};

/**
 * Creates request.
 * @param {Object} reqPart
 */
const createRequest = (reqPart) => {
    if (reqPart.includes('boundary=changeset')) {
        const sBoundary = reqPart.match(/boundary=(.*)/)[1];
        const request = {
                changeset: sBoundary,
                children: reqPart.split( '--' + sBoundary)
                    // jscs:disable
                    .filter(line => !line.startsWith('--') && !line.includes(sBoundary))
                    .map(createRequest)
                    // jscs:enable
            };

        return request;
    } else {
        const request = {
            headers: {}
        };
        // jscs:disable
        reqPart.split('\n').filter(unpopularLines).forEach(line => {
        // jscs:enable
            line = line.trim();
            if (line.match('(GET|POST|PATCH|PUT|DELETE).*')) {
                let [method, url, httpVersion] = line.split(' ');
                request.method = method;
                request.url = url;
                request.httpVersion = httpVersion;
            } else if (line.indexOf('{') === 0) {
                try {
                    request.body = JSON.parse(line);
                } catch (e) {
                    request.body = {parseError: 'invalid JSON'};
                }
            } else if (line) {
                let [name, value] = line.split(/:(.+)/);
                if (name.toLowerCase() === 'sap-messages') {
                    value = value.trim(' ');

                    // Expecting object or array, otherwise use as string
                    if (value.startsWith('{') || value.startsWith('[')) {
                        value = JSON.parse(value);
                    }
                }
                request.headers[name] = value;
            }
        });

        return request;
    }
};

/**
 * Transforms request if it has children.
 * @param {Object} entry
 */
const transformIfChildren = (entry) => {
    if (entry.request.children) {
        entry.changeset = entry.request.changeset;
        /**
         * Maps children requests.
         * @param {Object} request
         * @param {number} ind
         */
        entry.children = entry.request.children.map((request, ind) => ({
            request: request,
            response: (entry.response.children && entry.response.children.ind) || {
                status: 499,
                statusText: 'Unexpected use case of the OData Chrome Extension',
                headers: {}
            }
        }));
        delete entry.response;
        delete entry.request;
    }

    return entry;
};

/**
 * Removes empty lines.
 * @param {Object} x
 */
const removeEmptyLinesFilter = (x) => {
    const xm = x.replace(/\s\n/, '');

    return !!xm.length;
};

/**
 * Parses request/responses blocks.
 * @param {Object} requestsRaw
 * @param {Object} responseRaw
 * @returns {Array}
 */
const parseBlock = (requestsRaw, responseRaw) => {
    let responses = responseRaw.map(createResponse);
    /**
     * Maps raw requests.
     * @param {Object} reqPart
     * @param {number} ind
     */
    return requestsRaw.map((reqPart, ind) => transformIfChildren({
            request: createRequest(reqPart),
            response: responses[ind]
        })
    );
};

/* jshint ignore:start */
/**
 * De-multiparts request/responses.
 * @param {Object} content
 * @param {Object} req
 * @param {Object} res
 */
const deMultipart = (content, req, res) => {
    /**
     * De-multiparts request/responses.
     */
    return Promise.resolve().then(() => {
        /**
         * Finds request content type.
         * @param {Object} header
         */
        let resContentType = res.headers.find(header => header.name.toLowerCase() === 'content-type').value;
        let raw = atob(content);
        let reqBoundary = '--' + req.postData.mimeType.split('boundary=')[1];
        let resBoundary = '--' + resContentType.split('boundary=')[1];
        // jscs:disable
        let requestsRaw = req.postData.text.split(reqBoundary)
            .filter(line => !line.startsWith('--') && line !== '')
            .filter(removeEmptyLinesFilter);
        let responseRaw = raw.split(resBoundary)
            .filter(line => !line.startsWith('--') && line !== '')
            .filter(removeEmptyLinesFilter);
        // jscs:enable

        return parseBlock(requestsRaw, responseRaw);
    });
};
/* jshint ignore:end */

/* jshint ignore:start */
/**
 * Gets content of entry.
 * @param {Object} entry
 */
const getContent = entry =>
    /**
     * Resolves Promise.
     * @param {Function} resolve
     */
    Promise.resolve(new Promise((resolve) => {
        /**
         * Gets content of an entry.
         * @param {Object} content
         */
        entry.getContent(content => resolve(content));
    }));

exports.getContent = getContent;
/* jshint ignore:end */

/* jshint ignore:start */
/**
 * Extracts the content of multipart/mixed request response pairs and creates them as childEntries.
 * ChildEntries should follow the har spec of entries as far as possible.
 * @param {Object} entry
 */
exports.extractMultipartEntry = async (entry) =>
    entry.childEntries = await deMultipart(await getContent(entry), entry.request, entry.response);
/* jshint ignore:end */

/* jshint ignore:start */
/**
 * Extracts the content of multipart/mixed request response pairs.
 * @param {Object} entries
 */
exports.extractMultipartEntries = async (entries) => {
    await entries.forEach(extractMultipartEntry);
};
/* jshint ignore:end */
