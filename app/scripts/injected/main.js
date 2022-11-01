sap.ui.require(['ToolsAPI'], function (ToolsAPI) {
    'use strict';

    var ui5inspector = require('../modules/injected/ui5inspector.js');
    var message = require('../modules/injected/message.js');
    var controlUtils = require('../modules/injected/controlUtils.js');
    var rightClickHandler = require('../modules/injected/rightClickHandler.js');
    var applicationUtils = require('../modules/injected/applicationUtils');

    // Create global reference for the extension.
    ui5inspector.createReferences();

    /**
     * Mutation observer for DOM elements
     * @type {{init: Function, _observer: MutationObserver, _options: {subtree: boolean, childList: boolean, attributes: boolean}}}
     */
    var mutation = {

        /**
         * Initialize the observer.
         */
        init: function () {
            this._observer.observe(document.body, this._options);
        },

        /**
         * Create an observer instance.
         */
        _observer: new MutationObserver(function (mutations) {
            var isMutationValid = true;
            var controlTreeModel;
            var commonInformation;

            mutations.forEach(function (mutation) {
                if (mutation.target.id === 'ui5-highlighter' || mutation.target.id === 'ui5-highlighter-container') {
                    isMutationValid = false;
                    return;
                }
            });

            if (isMutationValid === true) {
                controlTreeModel = ToolsAPI.getRenderedControlTree();
                commonInformation = ToolsAPI.getFrameworkInformation().commonInformation;

                message.send({
                    action: 'on-application-dom-update',
                    controlTree: controlUtils.getControlTreeModel(controlTreeModel, commonInformation)
                });
            }
        }),

        // Configuration of the observer
        _options: {
            subtree: true,
            childList: true,
            // If this is set to true, some controls will trigger mutation(example: newsTile changing active tile)
            attributes: false
        }
    };

    // Initialize
    mutation.init();

    /**
     * Writes HTML content of a Control in the user's clipboard
     * @param {String} text
     * @private
     */
    function _writeInClipboardFromDevTools(text) {
        return new Promise((resolve, reject) => {
            /* jshint ignore:start */
            var _asyncCopyFn = (async () => {
                try {
                    var value = await navigator.clipboard.writeText(text);
                    resolve(value);
                } catch (e) {
                    reject(e);
                }
                window.removeEventListener('focus', _asyncCopyFn);
            });

            window.addEventListener('focus', _asyncCopyFn);
            /* jshint ignore:end */

            var event = new Event('focus');
            window.dispatchEvent(event);
        });
    }

    /**
     * Sets control's property.
     * @param {Object} oControl
     * @param {Object} oData - property's data
     * @private
     */
    function _setControlProperties (oControl, oData) {
        var sProperty = oData.property;
        var oNewValue = oData.value;

        try {
            // Change the property through its setter
            oControl['set' + sProperty](oNewValue);
        } catch (error) {
            console.warn(error);
        }
    }

    // Name space for message handler functions.
    var messageHandler = {

        /**
         * Send message with the needed initial information for the extension.
         */
        'get-initial-information': function () {
            var controlTreeModel = ToolsAPI.getRenderedControlTree();
            var frameworkInformation = ToolsAPI.getFrameworkInformation();

            message.send({
                action: 'on-receiving-initial-data',
                applicationInformation: applicationUtils.getApplicationInfo(frameworkInformation),
                controlTree: controlUtils.getControlTreeModel(controlTreeModel, frameworkInformation.commonInformation),
                elementRegistry: ToolsAPI.getRegisteredElements()
            });
        },

        /**
         * Send framework information.
         */
        'get-framework-information': function () {
            var frameworkInformation = ToolsAPI.getFrameworkInformation();

            message.send({
                action: 'on-framework-information',
                frameworkInformation: applicationUtils.getInformationForPopUp(frameworkInformation)
            });
        },

        /**
         * Handler for logging event listener fucntion.
         * @param {Object} event
         */
        'do-console-log-event-listener': function (event) {
            var evtData = event.detail.data;
            console.log(sap.ui.getCore().byId(evtData.controlId).mEventRegistry[evtData.eventName][evtData.listenerIndex].fFunction);
        },

        /**
         * Handler for element selection in the ControlTree.
         * @param {Object} event
         */
        'do-control-select': function (event) {
            var controlId = event.detail.target;
            var controlProperties = ToolsAPI.getControlProperties(controlId);
            var controlBindings = ToolsAPI.getControlBindings(controlId);
            var controlAggregations = ToolsAPI.getControlAggregations(controlId);
            var controlEvents = ToolsAPI.getControlEvents(controlId);

            message.send({
                action: 'on-control-select',
                controlProperties: controlUtils.getControlPropertiesFormattedForDataView(controlId, controlProperties),
                controlBindings: controlUtils.getControlBindingsFormattedForDataView(controlBindings),
                controlAggregations: controlUtils.getControlAggregationsFormattedForDataView(controlId, controlAggregations),
                controlEvents: controlUtils.getControlEventsFormattedForDataView(controlId, controlEvents),
                controlActions: controlUtils.getControlActionsFormattedForDataView(controlId)
            });
        },

        /**
         * Handler for element selection in the Elements Registry.
         * @param {Object} event
         */
        'do-control-select-elements-registry': function (event) {
            var controlId = event.detail.target;
            var controlProperties = ToolsAPI.getControlProperties(controlId);
            var controlBindings = ToolsAPI.getControlBindings(controlId);
            var controlAggregations = ToolsAPI.getControlAggregations(controlId);
            var controlEvents = ToolsAPI.getControlEvents(controlId);

            message.send({
                action: 'on-control-select-elements-registry',
                controlProperties: controlUtils.getControlPropertiesFormattedForDataView(controlId, controlProperties),
                controlBindings: controlUtils.getControlBindingsFormattedForDataView(controlBindings),
                controlAggregations: controlUtils.getControlAggregationsFormattedForDataView(controlId, controlAggregations),
                controlEvents: controlUtils.getControlEventsFormattedForDataView(controlId, controlEvents)
            });
        },

        /**
         * Handler for refreshing elements in Elements Registry.
         */
        'do-elements-registry-refresh': function () {
            message.send({
                action: 'on-receiving-elements-registry-refresh-data',
                elementRegistry: ToolsAPI.getRegisteredElements()
            });
        },

        /**
         * Send message with the inspected UI5 control, from the context menu.
         * @param {Object} event
         */
        'select-control-tree-element-event': function (event) {
            var portMessage = event.detail;

            message.send({
                action: 'on-contextMenu-control-select',
                target: portMessage.target,
                frameId: event.detail.frameId
            });
        },

        /**
         * Change control property, based on editing in the DataView.
         * @param {Object} event
         */
        'do-control-property-change': function (event) {
            var oData = event.detail.data;
            var sControlId = oData.controlId;
            var oControl = sap.ui.getCore().byId(sControlId);

            if (!oControl) {
                return;
            }

            _setControlProperties(oControl, oData);

            // Update the DevTools with the actual property value of the control
            this['do-control-select']({
                detail: {
                    target: sControlId
                }
            });
        },

        'do-control-invalidate': function (event) {
            var oData = event.detail.data;
            var sControlId = oData.controlId;
            var oControl = sap.ui.getCore().byId(sControlId);

            if (!oControl) {
                return;
            }

            oControl.invalidate();

            // Update the DevTools with the actual property value of the control
            this['do-control-select']({
                detail: {
                    target: sControlId
                }
            });
        },

        'do-control-focus': function (event) {
            var oData = event.detail.data;
            var sControlId = oData.controlId;
            var oControl = sap.ui.getCore().byId(sControlId);

            if (!oControl) {
                return;
            }

            oControl.focus();

        },

        /**
         * Change control property, based on editing in the DataView.
         * @param {Object} event
         */
        'do-control-property-change-elements-registry': function (event) {
            var oData = event.detail.data;
            var sControlId = oData.controlId;
            var oControl = sap.ui.getCore().byId(sControlId);

            if (!oControl) {
                return;
            }

            _setControlProperties(oControl, oData);

            // Update the DevTools with the actual property value of the control
            this['do-control-select-elements-registry']({
                detail: {
                    target: sControlId
                }
            });
        },

        /**
         * Selects Control with context menu click.
         * @param {Object} event
         */
        'do-context-menu-control-select': function (event) {
            message.send({
                action: 'on-contextMenu-control-select',
                target: event.detail.target,
                frameId: event.detail.frameId
            });
        },

        /**
         * Copies HTML of Control with context menu click.
         * @param {Object} event
         */
        'do-context-menu-copy-html': function (event) {
            var elementID = event.detail.target;
            var navigatorClipBoard = navigator && navigator.clipboard;
            var selectedElement;

            if (typeof elementID !== 'string') {
                console.warn('Please use a valid string parameter');
                return;
            }

            if (!navigatorClipBoard) {
                console.warn('This functionality is not enabled');
                return;
            }

            selectedElement = document.getElementById(elementID);
            _writeInClipboardFromDevTools(selectedElement.outerHTML);
        }
    };

    /**
     * Register mousedown event.
     */
    ui5inspector.registerEventListener('mousedown', function rightClickTarget(event) {
        if (event.button === 2) {
            rightClickHandler.setClickedElementId(event.target);
            message.send({
                action: 'on-right-click',
                target: rightClickHandler.getClickedElementId()
            });
        }
    });

    /**
     * Register custom event for communication with the injected.
     */
    ui5inspector.registerEventListener('ui5-communication-with-injected-script', function communicationWithContentScript(event) {
        var action = event.detail.action;

        if (messageHandler[action]) {
            messageHandler[action](event);
        }
    });
});
