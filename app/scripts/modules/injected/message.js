'use strict';

module.exports = {
    /**
     * Send message to content script.
     * @param {Object} object
     */
    send: function (object) {
        var message = {
            detail: object
        };

        document.dispatchEvent(new CustomEvent('ui5-communication-with-content-script', message));
    }
};
