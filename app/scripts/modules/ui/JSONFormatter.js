'use strict';

/**
 * Sample usage
 * JSONView = require('../../../modules/ui/JSONFormatter.js');
 * JSONViewFormater.formatJSONtoHTML(sampleJSONData);
 */

/**
 *
 * @param {Object} json
 * @returns {string|HTML}
 * @private
 */
function _syntaxHighlight(json) {
    json = JSON.stringify(json, undefined, 2);
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var tagName = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                tagName = 'key';
            } else {
                tagName = 'string';
            }
        } else if (/true|false/.test(match)) {
            tagName = 'boolean';
        } else if (/null/.test(match)) {
            tagName = 'null';
        }
        return '<' + tagName + '>' + match + '</' + tagName + '>';
    });
}

module.exports = {

    /**
     * Create HTML from a json object.
     * @param {Object} json
     * @returns {string}
     */
    formatJSONtoHTML: function (json) {
        return '<pre json>' + _syntaxHighlight(json) + '</pre>';
    }
};
