'use strict';

module.exports = {
    /**
     * Send message to content script.
     * @param {Object} object
     */
    send: function (object) {
        var message = {
            detail: JSON.parse(JSON.stringify(object))
        };

        document.dispatchEvent(new CustomEvent('ui5-communication-with-content-script', message));
    }
};
