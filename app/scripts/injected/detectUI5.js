(function () {
    'use strict';

    /**
     * Create an object witch the initial needed information from the UI5 availability check.
     * @returns {Object}
     */
    function createResponseToContentScript() {
        var responseToContentScript = Object.create(null);
        var responseToContentScriptBody;
        var frameworkInfo;
        var versionInfo;

        responseToContentScript.detail = Object.create(null);
        responseToContentScriptBody = responseToContentScript.detail;

        if (window.sap && window.sap.ui) {
            responseToContentScriptBody.action = 'on-ui5-detected';
            responseToContentScriptBody.framework = Object.create(null);

            // Get framework version
            try {
                responseToContentScriptBody.framework.version = sap.ui.getCore().getConfiguration().getVersion().toString();
            } catch (e) {
                responseToContentScriptBody.framework.version = '';
            }

            // Get framework name
            try {
                versionInfo = sap.ui.getVersionInfo();

                // Use group artifact version for maven builds or name for other builds (like SAPUI5-on-ABAP)
                frameworkInfo = versionInfo.gav ? versionInfo.gav : versionInfo.name;

                responseToContentScriptBody.framework.name = frameworkInfo.indexOf('openui5') !== -1 ? 'OpenUI5' : 'SAPUI5';
            } catch (e) {
                responseToContentScriptBody.framework.name = 'UI5';
            }

            // Check if the version is supported
            responseToContentScriptBody.isVersionSupported = !!sap.ui.require;

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
