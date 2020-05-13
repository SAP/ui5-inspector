'use strict';

/**
 * Parses given object into a JSON object removing all functions and handle circular references.
 * @param {Object} object - input object, must not be null
 * @returns {Object} JSON object
 * @private
 */
function _prepareMessage(object) {
    var target = {};
    var todo = [{source: object, target: target}];
    var done = [];
    var doneTargets = [];
    var current;

    while ((current = todo.pop()) !== undefined) {
        done.push(current.source);
        doneTargets.push(current.target);
        for (var sKey in current.source) {
            if (!Object.prototype.hasOwnProperty.call(current.source, sKey)) {
                continue;
            }
            var child = current.source[sKey];
            if (child === undefined || typeof child === 'function') {
                // Ignore undefined and functions (similar to JSON.stringify)
                continue;
            }
            var index = done.indexOf(child);
            if (index !== -1) {
                // Resolve detected circular references by using already parsed/created target
                current.target[sKey] = doneTargets[index];
            } else if (child !== null && typeof child === 'object') {
                // Deep copy objects by adding them to the to-do list (iterative approach)
                current.target[sKey] = Array.isArray(child) ? [] : {};
                todo.push({target: current.target[sKey], source: child});
            } else {
                // Copy the unhandled types that are left: 'number', 'boolean', 'string', and null
                current.target[sKey] = child;
            }
        }
    }

    return target;
}

module.exports = {
    /**
     * Send message to content script.
     * @param {Object} object
     */
    send: function (object) {
        var message = {
            detail: _prepareMessage(object)
        };

        document.dispatchEvent(new CustomEvent('ui5-communication-with-content-script', message));
    }
};
