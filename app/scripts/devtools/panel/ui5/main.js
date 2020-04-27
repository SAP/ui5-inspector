(function () {
    'use strict';

    // ================================================================================
    // Main controller for 'UI5' tab in devtools
    // ================================================================================

    // ================================================================================
    // Bootstrap
    // ================================================================================

    // Components that need to be required and reference
    // ================================================================================
    var utils = require('../../../modules/utils/utils.js');
    var TabBar = require('../../../modules/ui/TabBar.js');
    var ControlTree = require('../../../modules/ui/ControlTree.js');
    var DataView = require('../../../modules/ui/DataView.js');
    var Splitter = require('../../../modules/ui/SplitContainer.js');
    var ODataDetailView = require('../../../modules/ui/ODataDetailView.js');
    var ODataMasterView = require('../../../modules/ui/ODataMasterView.js');

    // Apply theme
    // ================================================================================
    utils.applyTheme(chrome.devtools.panels.themeName);

    // Create a port with background page for continuous message communication
    // ================================================================================
    var port = chrome.extension.connect({name: 'devtools-tabId-' + chrome.devtools.inspectedWindow.tabId});

    // Bootstrap for 'Control inspector' tab
    // ================================================================================
    utils.setOSClassName();

    // Main tabbar inside 'UI5' devtools panel
    var UI5TabBar = new TabBar('ui5-tabbar');

    // Horizontal Splitter for 'Control Inspector' tab
    var controlInspectorHorizontalSplitter = new Splitter('horizontal-splitter', {
        endContainerWidth: '400px',
        isEndContainerClosable: true
    });

    // Control tree
    var controlTree = new ControlTree('control-tree', {

        /**
         * Send message, that the a new element is selected in the ControlTree.
         * @param {string} selectedElementId
         */
        onSelectionChanged: function (selectedElementId) {
            port.postMessage({
                action: 'do-control-select',
                target: selectedElementId
            });
        },

        /**
         * Send message, that the a new element is hovered in the ControlTree.
         * @param {string} hoveredElementId
         */
        onHoverChanged: function (hoveredElementId) {
            port.postMessage({
                action: 'on-control-tree-hover',
                target: hoveredElementId
            });
        },

        /**
         * Fired at first rendering of the ControlTree.
         */
        onInitialRendering: function () {
            var controls = this.getData().controls;
            this.setSelectedElement(controls[0].id);
        }
    });

    // Tabbar for Controltree additional information (Properties, Binding and etc)
    var controlTreeTabBar = new TabBar('control-tree-tabbar');

    // Dataview for control properties
    var controlProperties = new DataView('control-properties', {

        /**
         * Send message, that an proprety in the DataView is changed.
         * @param {Object} changeData
         */
        onPropertyUpdated: function (changeData) {
            port.postMessage({
                action: 'do-control-property-change',
                data: changeData
            });
        }
    });

    // Vertical splitter for 'Bindings' tab
    var controlBindingsSplitter = new Splitter('control-bindings-splitter', {
        hideEndContainer: true,
        isEndContainerClosable: true,
        endContainerTitle: 'Model Information'
    });

    // Dataview for control binding information - left part
    var controlBindingInfoLeftDataView = new DataView('control-bindings-left', {

        /**
         * Method fired when a clickable element is clicked.
         * @param {Object} event
         */
        onValueClick: function (event) {
            var dataFormatedForDataView = {
                modelInfo: {
                    options: {
                        title: 'Model Information',
                        expandable: false,
                        expanded: true,
                        hideTitle: true
                    },
                    data: event.data
                }
            };

            controlBindingInfoRightDataView.setData(dataFormatedForDataView);
            controlBindingsSplitter.showEndContainer();
        }
    });

    // Dataview for control binding information
    var controlBindingInfoRightDataView = new DataView('control-bindings-right');

    // Bootstrap for 'Control inspector' tab
    // ================================================================================

    // Dataview for 'Application information' tab
    var appInfo = new DataView('app-info');


    // Bootstrap for 'OData' tab
    // ================================================================================
    var odataHorizontalSplitter = new Splitter('odata-horizontal-splitter', {
        endContainerWidth: '50%',
        isEndContainerClosable: true,
        hideEndContainer: true
    });

    var oDataDetailView = new ODataDetailView("odata-tab-detail");
    new ODataMasterView("odata-tab-master", {
        onSelectItem: function(data) {
            odataHorizontalSplitter.showEndContainer();
            oDataDetailView.update(data);
        },
        onClearItems: function() {
            oDataDetailView.clear();
            odataHorizontalSplitter.hideEndContainer();
        }
    });


    // ================================================================================
    // Communication
    // ================================================================================

    // Name space for message handler functions.
    var messageHandler = {

        /**
         * Send object to background page.
         * @param {Object} message
         */
        'on-port-connection': function (message) {
            port.postMessage({action: 'do-ui5-detection'});
        },

        /**
         * Handler for UI5 detection on the current inspected page.
         * @param {Object} message
         */
        'on-ui5-detected': function (message) {
            var overlay = document.getElementById('supportability');
            var overlayNoUI5Section = overlay.querySelector('[no-ui5-version]');
            var overlayUnsupportedVersionSection = overlay.querySelector('[unsupported-version]');

            if (message.isVersionSupported) {
                overlay.setAttribute('hidden', true);
            } else {
                overlay.removeAttribute('hidden');
                overlayNoUI5Section.style.display = 'none';
                overlayUnsupportedVersionSection.style.display = 'block';
            }

            port.postMessage({
                action: 'do-script-injection',
                tabId: chrome.devtools.inspectedWindow.tabId,
                file: '/scripts/content/main.js'
            });
        },

        /**
         * Get the initial needed information, when the main injected script is available.
         * @param {Object} message
         */
        'on-main-script-injection': function (message) {
            port.postMessage({
                action: 'get-initial-information'
            });
        },

        /**
         * Visualize the initial needed data for the extension.
         * @param {Object} message
         */
        'on-receiving-initial-data': function (message) {
            controlTree.setData(message.controlTree);
            appInfo.setData(message.applicationInformation);
        },

        /**
         * Updates the ControlTree, when the DOM in the inspected window is changed.
         * @param {Object} message
         */
        'on-application-dom-update': function (message) {
            controlTree.setData(message.controlTree);
        },

        /**
         * Handler for ControlTree element selecting.
         * @param {Object} message
         */
        'on-control-select': function (message) {
            controlProperties.setData(message.controlProperties);
            controlBindingInfoLeftDataView.setData(message.controlBindings);

            // Set bindings count
            document.querySelector('#tab-bindings count').innerHTML = '&nbsp;(' + Object.keys(message.controlBindings).length + ')';

            // Close possible open binding info and/or methods info
            controlBindingsSplitter.hideEndContainer();
        },

        /**
         * Select ControlTree element, based on selection in the Element panel.
         * @param {Object} message
         */
        'on-select-ui5-control-from-element-tab': function (message) {
            controlTree.setSelectedElement(message.nearestUI5Control);
        },

        /**
         * Select ControlTree element, based on right click and context menu.
         * @param {Object} message
         */
        'on-contextMenu-control-select': function (message) {
            controlTree.setSelectedElement(message.target);
        },

        /**
         * Handler for UI5 none detection on the current inspected page.
         * @param {Object} message
         */
        'on-ui5-not-detected': function (message) {
            var overlay = document.getElementById('supportability');
            var overlayNoUI5Section = overlay.querySelector('[no-ui5-version]');
            var overlayUnsupportedVersionSection = overlay.querySelector('[unsupported-version]');

            overlay.removeAttribute('hidden');

            overlayNoUI5Section.style.display = 'block';
            overlayUnsupportedVersionSection.style.display = 'none';
        }
    };

    // Listen for messages from the background page
    port.onMessage.addListener(function (message, messageSender, sendResponse) {
        // Resolve incoming messages
        utils.resolveMessage({
            message: message,
            messageSender: messageSender,
            sendResponse: sendResponse,
            actions: messageHandler
        });
    });

    // Restart everything when the URL is changed
    chrome.devtools.network.onNavigated.addListener(function () {
        port.postMessage({action: 'do-ui5-detection'});
    });
}());
