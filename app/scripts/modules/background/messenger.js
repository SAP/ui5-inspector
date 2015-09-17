'use strict';

/**
 * Maintainer for messages between all ports.
 * @type {{ports: {}, addPort: Function, deletePort: Function, sendToAll: Function}}
 */
var messenger = {

    // All connected ports
    ports: Object.create(null),

    /**
     * Add port for continues messaging.
     * @param {Object} port
     * @param {number} tabId
     */
    addPort: function (port, tabId) {
        if (!this.ports[tabId]) {
            this.ports[tabId] = {};
        }

        if (!this.ports[tabId][port.name]) {
            this.ports[tabId][port.name] = port;

            // Notify the newly added port that it is added in the messenger.
            // This is because in some cases the port is added asynchronously
            port.postMessage({action: 'on-port-connection'});
        }
    },

    /**
     * Delete disconnected port.
     * @param {Object} port
     * @param {number} tabId
     */
    deletePort: function (port, tabId) {
        if (this.ports[tabId] === undefined) {
            return;
        }

        delete this.ports[tabId][port.name];

        if (Object.keys(this.ports[tabId]).length === 0) {
            delete this.ports[tabId];
        }
    },

    /**
     * Resend message to all open ports.
     * @param {Object} message
     */
    sendToAll: function (message, tabId) {
        if (this.ports[tabId] === undefined) {
            return;
        }

        for (var key in this.ports[tabId]) {
            this.ports[tabId][key].postMessage(message);
        }
    }
};

module.exports = messenger;
