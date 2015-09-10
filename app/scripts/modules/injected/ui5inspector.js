'use strict';

/**
 * Create global reference for the extension.
 * @private
 */
function _createReferences() {
    if (window.ui5inspector === undefined) {
        window.ui5inspector = {
            events: Object.create(null)
        };
    }
}

/**
 * Register event listener if is not already registered.
 * @param {string} eventName - the name of the event that will be register
 * @callback
 * @private
 */
function _registerEventListener(eventName, callback) {
    if (window.ui5inspector.events[eventName] === undefined) {
        // Register reference
        window.ui5inspector.events[eventName] = {
            callback: callback.name,
            state: 'registered'
        };

        document.addEventListener(eventName, callback, false);
    }
}

module.exports = {
    createReferences: _createReferences,
    registerEventListener: _registerEventListener
};
