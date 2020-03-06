'use strict';

/**
 * Parses given object into a JSON object removing all functions and handle circular references.
 * @param {Object} object input object
 * @returns {Object} JSON object
 * @private
 */
function _prepareMessage(object) {
    if (object === null || object === undefined || typeof object === "function") {
        return null;
    }
    if (typeof object !== "object") {
        return object;
    }

    var target = Array.isArray(object) ? [] : {},
        todo = [{ source: object, target: target }],
        done = [],
        doneTargets = [],
        index,
        current,
        child;

    while ((current = todo.pop()) !== undefined) {
        done.push(current.source);
        doneTargets.push(current.target);
        Object.keys(current.source).forEach(function (sKey) {
            child = current.source[sKey];
            if (child === undefined || typeof child === "function") {
                // ignore undefined and functions (similar to JSON.stringify)
            } else if ((index = done.indexOf(child)) !== -1) {
                current.target[sKey] = doneTargets[index];
            } else if (child !== null && typeof child === "object") {
                current.target[sKey] = Array.isArray(child) ? [] : {};
                todo.push({ target: current.target[sKey], source: child });
            } else {
                current.target[sKey] = child;
            }
        });
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
