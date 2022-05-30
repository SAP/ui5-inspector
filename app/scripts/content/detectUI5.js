(function () {
    'use strict';

    var utils = require('../modules/utils/utils.js');

    // Create a port with background page for continuous message communication
    var port = utils.getPort();

    // Inject a script file in the current page
    var script = document.createElement('script');
    script.src = chrome.runtime.getURL('/scripts/injected/detectUI5.js');
    document.head.appendChild(script);

    /**
     * Delete the injected file, when it is loaded.
     */
    script.onload = function () {
        script.parentNode.removeChild(script);
    };

    // Listen for messages from the background page
    port.onMessage(function (message) {
        // Resolve incoming messages
        if (message.action === 'do-ui5-detection') {
            document.dispatchEvent(new Event('do-ui5-detection-injected'));
        }
    });

    /**
     *  Listens for messages from the injected script.
     */
    document.addEventListener('detect-ui5-content', function sendEvent(detectEvent) {
        // Send the received event detail object to background page
        port.postMessage(detectEvent.detail);

    }, false);
}());
