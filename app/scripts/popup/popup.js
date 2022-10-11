'use strict';

var utils = require('../modules/utils/utils.js');

chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    // Create a port with background page for continuous message communication
    var port = utils.getPort();

    // Name space for message handler functions.
    var messageHandler = {

        /**
         * Ask for the framework information, as soon as the main script is injected.
         * @param {Object} message
         */
        'on-main-script-injection': function (message) {
            port.postMessage({action: 'get-framework-information'});
        },

        /**
         * Visualize the framework information.
         * @param {Object} message
         */
        'on-framework-information': function (message) {
            var linksDom;
            var library = document.querySelector('library');
            var buildtime = document.querySelector('buildtime');

            if (message.frameworkInformation.OpenUI5) {
                linksDom = document.querySelector('links[openui5]');
                library.innerText = 'OpenUI5';
                buildtime.innerText = message.frameworkInformation.OpenUI5;
            } else {
                linksDom = document.querySelector('links[sapui5]');
                library.innerText = 'SAPUI5';
                buildtime.innerText = message.frameworkInformation.SAPUI5;
            }

            linksDom.removeAttribute('hidden');
        }
    };

    // Listen for messages from the background page
    port.onMessage(function (message, messageSender, sendResponse) {
        // Resolve incoming messages
        utils.resolveMessage({
            message: message,
            messageSender: messageSender,
            sendResponse: sendResponse,
            actions: messageHandler
        });
    });

    port.postMessage({
        action: 'do-script-injection',
        tabId: tabs[0].id,
        file: '/scripts/content/main.js'
    });
});
