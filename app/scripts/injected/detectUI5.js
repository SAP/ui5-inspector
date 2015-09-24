(function () {
    'use strict';

    /**
     * Create an object witch the initial needed information from the UI5 availability check.
     * @returns {Object}
     */
    function createResponseToContentScript() {
        var responseToContentScript = Object.create(null);
        responseToContentScript.detail = Object.create(null);

        var responseToContentScriptBody = responseToContentScript.detail;

        if (window.sap) {

            responseToContentScriptBody.action = 'on-ui5-detected';
            responseToContentScriptBody.framework = Object.create(null);

            // Get minimal framework information
            try {
                responseToContentScriptBody.framework.version = sap.ui.getVersionInfo().version;
            } catch (e) {
                responseToContentScriptBody.framework.version = '';
            }
            try {
                responseToContentScriptBody.framework.name = sap.ui.getVersionInfo().gav.indexOf('openui5') !== -1 ? 'OpenUI5' : 'SAPUI5';
            } catch (e) {
                responseToContentScriptBody.framework.name = '';
            }

            // Check if the version is supported
            if (sap.ui.require) {
                responseToContentScriptBody.isVersionSupported = true;
            } else {
                responseToContentScriptBody.isVersionSupported = false;
            }

        } else {
            responseToContentScriptBody.action = 'on-ui5-not-detected';
        }

        return responseToContentScript;
    }

    // Send information to content script
    document.dispatchEvent(new CustomEvent('detect-ui5-content', createResponseToContentScript()));

    // Listens for event from injected script
    document.addEventListener('do-ui5-detection-injected', function () {
        document.dispatchEvent(new CustomEvent('detect-ui5-content', createResponseToContentScript()));
    }, false);
}());
