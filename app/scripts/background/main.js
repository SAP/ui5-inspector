(function () {
    'use strict';

    var utils = require('../modules/utils/utils.js');
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
        utils.sendToAll({
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
                    tabId: messageSender.tab.id
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
            chrome.windows.getCurrent(w => {
                chrome.tabs.query({ active: true, windowId: w.id }, tabs => {
                    chrome.scripting.executeScript({
                        target: {
                            tabId: tabs[0].id
                        },
                        files: [message.file]
                    });
                });
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

    chrome.runtime.onMessage.addListener(function (request, messageSender, sendResponse) {
        // Resolve incoming messages
        utils.resolveMessage({
            message: request,
            messageSender: messageSender,
            sendResponse: sendResponse,
            actions: messageHandler
        });

        utils.sendToAll(request);
    });

    chrome.runtime.onInstalled.addListener(() => {
        // Page actions are disabled by default and enabled on select tabs
        chrome.action.disable();
    });
}());
