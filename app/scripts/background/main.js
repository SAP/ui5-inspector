(function () {
    'use strict';

    var utils = require('../modules/utils/utils.js');
    var messenger = require('../modules/background/messenger.js');
    var ContextMenu = require('../modules/background/ContextMenu.js');
    var pageAction = require('../modules/background/pageAction.js');

    var contextMenu = new ContextMenu({
        title: 'Inspect UI5 control',
        id: 'context-menu',
        contexts: ['all']
    });

    /**
     * This method will be fired when an instanced is clicked. The idea is to be overwritten from the instance.
     * @param {Object} info - Information sent when a context menu item is clicked. Check chrome.contextMenus.onClicked.
     * @param {Object} tab - The details of the tab where the click took place.
     */
    contextMenu.onClicked = function (info, tab) {
        messenger.sendToAll({
            action: 'on-contextMenu-control-select',
            target: contextMenu._rightClickTarget
        }, tab.id);
    };

    // Name space for message handler functions.
    var messageHandler = {

        /**
         * Create an icons with hover information inside the address bar.
         * @param {Object} message
         * @param {Object} messageSender
         */
        'on-ui5-detected': function (message, messageSender) {
            var framework = message.framework;

            if (message.isVersionSupported === true) {
                pageAction.create({
                    version: framework.version,
                    framework: framework.name,
                    tabId: messageSender.sender.tab.id
                });

                pageAction.enable();
            }
        },

        /**
         * Handler for UI5 none detection on the current inspected page.
         * @param {Object} message
         */
        'on-ui5-not-detected': function (message) {
            pageAction.disable();
        },

        /**
         * Inject script into the inspected page.
         * @param {Object} message
         */
        'do-script-injection': function (message) {
            chrome.scripting.executeScript({
                target: {
                    tabId: message.tabId
                },
                files: [message.file]
            });
        },

        /**
         * Set the element that was clicked with the right button of the mouse.
         * @param {Object} message
         */
        'on-right-click': function (message) {
            contextMenu.setRightClickTarget(message.target);
        },

        /**
         * Create the button for the context menu, when the user switches to the "UI5" panel.
         * @param {Object} message
         */
        'on-ui5-devtool-show': function (message) {
            contextMenu.create();
        },

        /**
         * Delete the button for the context menu, when the user switches away to the "UI5" panel.
         * @param {Object} message
         */
        'on-ui5-devtool-hide': function (message) {
            contextMenu.removeAll();
        }
    };

    /**
     * Add handler for resolving messages from the other scripts.
     * @param {Object} port - An object which allows two way communication with other scripts/pages.
     * @param {string} tabId - The tab ID of the current inspected page.
     * @private
     */
    function _listenForPortMessages(port, tabId) {
        port.onMessage.addListener(function (message, messageSender, sendResponse) {
            // Resolve incoming messages
            utils.resolveMessage({
                message: message,
                messageSender: messageSender,
                sendResponse: sendResponse,
                actions: messageHandler
            });

            // Send message to all ports
            messenger.sendToAll(message, tabId);
        });
    }

    /**
     * Delete the disconnected port from 'ports' object.
     * @param {Object} port - An object which allows two way communication with other scripts/pages.
     * @param {string} tabId - The tab ID of the current inspected page.
     * @private
     */
    function _listenForPortDisconnect(port, tabId) {
        port.onDisconnect.addListener(function (port) {
            messenger.deletePort(port, tabId);

            // Delete the context menu when devtools is closed
            if (port.name.indexOf('devtools-initialize') !== -1) {
                contextMenu.removeAll();
            }
        });
    }

    /**
     * Save the connected port and attache the needed event listeners.
     * @param {Object} port - An object which allows two way communication with other scripts/pages.
     * @param {string} tabId - The tab ID of the current inspected page.
     * @private
     */
    function _setPort(port, tabId) {
        messenger.addPort(port, tabId);
        _listenForPortMessages(port, tabId);
        _listenForPortDisconnect(port, tabId);
    }

    // Listens for messages from devtools panel and content scripts
    chrome.runtime.onConnect.addListener(function (port) {
        var splitPortName = port.name.split('-');
        var tabId;

        if (port.name.indexOf('tabId') !== -1) {
            tabId = splitPortName[splitPortName.length - 1];
        } else {
            tabId = port.sender.tab.id;
        }

        _setPort(port, tabId);
    });

    chrome.runtime.onInstalled.addListener(() => {
        // Page actions are disabled by default and enabled on select tabs
        chrome.action.disable();
    });
}());
