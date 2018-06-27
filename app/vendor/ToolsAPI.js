sap.ui.define(['jquery.sap.global', 'sap/ui/core/library', 'sap/ui/Global', 'sap/ui/core/Core', 'sap/ui/core/ElementMetadata'],
    function (jQuery, library, Global, Core, ElementMetadata) {
        'use strict';

        var configurationInfo = sap.ui.getCore().getConfiguration();

        // ================================================================================
        // Technical Information
        // ================================================================================

        /**
         * Returns the framework name.
         * @returns {string}
         * @private
         */
        function _getFrameworkName() {
            var versionInfo;
            var frameworkInfo;

            try {
                versionInfo = sap.ui.getVersionInfo();
            } catch (e) {
                versionInfo = undefined;
            }

            if (versionInfo) {
                // Use group artifact version for maven builds or name for other builds (like SAPUI5-on-ABAP)
                frameworkInfo = versionInfo.gav ? versionInfo.gav : versionInfo.name;

                return frameworkInfo.indexOf('openui5') !== -1 ? 'OpenUI5' : 'SAPUI5';
            } else {
                return '';
            }
        }

        /**
         * Creates an object with the libraries and their version from the version info file.
         * @returns {Object}
         * @private
         */
        function _getLibraries() {
            var libraries = Global.versioninfo ? Global.versioninfo.libraries : undefined;
            var formattedLibraries = Object.create(null);

            if (libraries !== undefined) {
                libraries.forEach(function (element, index, array) {
                    formattedLibraries[element.name] = element.version;
                });
            }

            return formattedLibraries;
        }

        /**
         * Creates an object with the loaded libraries and their version.
         * @returns {Object}
         * @private
         */
        function _getLoadedLibraries() {
            var libraries = sap.ui.getCore().getLoadedLibraries();
            var formattedLibraries = Object.create(null);

            Object.keys(sap.ui.getCore().getLoadedLibraries()).forEach(function (element, index, array) {
                formattedLibraries[element] = libraries[element].version;
            });

            return formattedLibraries;
        }

        /**
         * Gets all the relevant information for the framework.
         * @returns {Object}
         * @private
         */
        function _getFrameworkInformation() {
            return {
                commonInformation: {
                    frameworkName: _getFrameworkName(),
                    version: Global.version,
                    buildTime: Global.buildinfo.buildtime,
                    lastChange: Global.buildinfo.lastchange,
                    userAgent: navigator.userAgent,
                    applicationHREF: window.location.href,
                    documentTitle: document.title,
                    documentMode: document.documentMode || '',
                    debugMode: jQuery.sap.debug(),
                    statistics: jQuery.sap.statistics()
                },

                configurationBootstrap: window['sap-ui-config'] || Object.create(null),

                configurationComputed: {
                    theme: configurationInfo.getTheme(),
                    language: configurationInfo.getLanguage(),
                    formatLocale: configurationInfo.getFormatLocale(),
                    accessibility: configurationInfo.getAccessibility(),
                    animation: configurationInfo.getAnimation(),
                    rtl: configurationInfo.getRTL(),
                    debug: configurationInfo.getDebug(),
                    inspect: configurationInfo.getInspect(),
                    originInfo: configurationInfo.getOriginInfo(),
                    noDuplicateIds: configurationInfo.getNoDuplicateIds()
                },

                libraries: _getLibraries(),

                loadedLibraries: _getLoadedLibraries(),

                loadedModules: jQuery.sap.getAllDeclaredModules().sort(),

                URLParameters: jQuery.sap.getUriParameters().mParams
            };
        }

        // ================================================================================
        // Control tree Information
        // ================================================================================

        /**
         * Name space for all methods related to control trees
         */
        var controlTree = {
            /**
             * Creates data model of the rendered controls as a tree.
             * @param {Element} nodeElement - HTML DOM element from which the function will star searching.
             * @param {Array} resultArray - Array that will contains all the information.
             * @private
             */
            _createRenderedTreeModel: function (nodeElement, resultArray) {
                var node = nodeElement;
                var childNode = node.firstElementChild;
                var results = resultArray;
                var subResult = results;
                var control = sap.ui.getCore().byId(node.id);

                if (node.getAttribute('data-sap-ui') && control) {
                    results.push({
                        id: control.getId(),
                        name: control.getMetadata().getName(),
                        type: 'sap-ui-control',
                        content: []
                    });

                    subResult = results[results.length - 1].content;
                } else if (node.getAttribute('data-sap-ui-area')) {
                    results.push({
                        id: node.id,
                        name: 'sap-ui-area',
                        type: 'data-sap-ui',
                        content: []
                    });

                    subResult = results[results.length - 1].content;
                }

                while (childNode) {
                    this._createRenderedTreeModel(childNode, subResult);
                    childNode = childNode.nextElementSibling;
                }
            }
        };

        // ================================================================================
        // Control Information
        // ================================================================================

        /**
         * Name space for all information relevant for UI5 control
         */
        var controlInformation = {

            // Control Properties Info
            // ================================================================================

            /**
             * Creates an object with the control properties that are not inherited.
             * @param {Object} control - UI5 control.
             * @returns {Object}
             * @private
             */
            _getOwnProperties: function (control) {
                var result = Object.create(null);
                var controlPropertiesFromMetadata = control.getMetadata().getProperties();

                result.meta = Object.create(null);
                result.meta.controlName = control.getMetadata().getName();

                result.properties = Object.create(null);
                Object.keys(controlPropertiesFromMetadata).forEach(function (key) {
                    result.properties[key] = Object.create(null);
                    result.properties[key].value = control.getProperty(key);
                    result.properties[key].type = controlPropertiesFromMetadata[key].getType().getName ? controlPropertiesFromMetadata[key].getType().getName() : '';
                });

                return result;
            },

            /**
             * Copies the inherited properties of a UI5 control from the metadata.
             * @param {Object} control - UI5 Control.
             * @param {Object} inheritedMetadata - UI5 control metadata.
             * @returns {Object}
             * @private
             */
            _copyInheritedProperties: function (control, inheritedMetadata) {
                var inheritedMetadataProperties = inheritedMetadata.getProperties();
                var result = Object.create(null);

                result.meta = Object.create(null);
                result.meta.controlName = inheritedMetadata.getName();

                result.properties = Object.create(null);
                Object.keys(inheritedMetadataProperties).forEach(function (key) {
                    result.properties[key] = Object.create(null);
                    result.properties[key].value = inheritedMetadataProperties[key].get(control);
                    result.properties[key].type = inheritedMetadataProperties[key].getType().getName ? inheritedMetadataProperties[key].getType().getName() : '';
                });

                return result;
            },

            /**
             * Creates an array with the control properties that are inherited.
             * @param {Object} control - UI5 control.
             * @returns {Array}
             * @private
             */
            _getInheritedProperties: function (control) {
                var result = [];
                var inheritedMetadata = control.getMetadata().getParent();

                while (inheritedMetadata instanceof ElementMetadata) {
                    result.push(this._copyInheritedProperties(control, inheritedMetadata));
                    inheritedMetadata = inheritedMetadata.getParent();
                }

                return result;
            },

            /**
             * Creates an object with all control properties.
             * @param {string} controlId
             * @returns {Object}
             * @private
             */
            _getProperties: function (controlId) {
                var control = sap.ui.getCore().byId(controlId);
                var properties = Object.create(null);

                if (control) {
                    properties.own = this._getOwnProperties(control);
                    properties.inherited = this._getInheritedProperties(control);
                }

                return properties;
            },

            // Binding Info
            // ================================================================================

            /**
             * Creates an object containing all information about a model, it's data and the
             * data with respect to the given path.
             *
             * @param {Object} model - model can be either a "real" model or a model-context
             * @param {string} path
             * @returns {Object}
             * @private
             */
            _getModelInfo: function (model, path) {
                if (!model) {
                    return null;
                }

                if (path === null || path === undefined) {
                    path = "";
                }
                var modelInfo = {
                    type: "",
                    modelName: "",
                    modelData: "",
                    path: "",
                    fullPath: "",
                    pathData: "",
                    mode: ""
                };
                try {
                    var pathParts = path.split('>');
                    var pathContainsModelName = pathParts.length > 1;
                    var pathWithoutModel = pathContainsModelName ? pathParts[1] : pathParts[0];
                    var isRelative = pathWithoutModel.indexOf('/') !== 0;
                    var type = model.getMetadata().getName();
                    var isResourceModel = type === "sap.ui.model.resource.ResourceModel";
                    var fullPath;
                    var contextPath;

                    // we dont care about the context if path is absolute
                    if(!isRelative) {
                        model = model.getModel && model.getModel() || model;
                    }

                    // include contextpath if any (getPath function is only defined on model-context)
                    contextPath = isRelative && model.getPath && model.getPath() || '';
                    // when the model is resource the full path must be without /
                    if (isRelative && pathWithoutModel && !isResourceModel) {
                        fullPath = contextPath + '/' + pathWithoutModel;
                    } else {
                        fullPath = contextPath + pathWithoutModel;
                    }
                    // in case its a model context, retrieve the underlying model
                    model = model.getModel && model.getModel() || model;

                    // functions in the model cannot communicated via message
                    modelInfo.modelData = isResourceModel ? "" : model.getObject(contextPath || '/');
                    modelInfo.pathData = model.getProperty(fullPath);
                    modelInfo.fullPath = fullPath;
                    modelInfo.path = pathWithoutModel;
                    modelInfo.mode =  model.getDefaultBindingMode();
                    modelInfo.modelName = pathContainsModelName ? pathParts[0] : undefined;
                    modelInfo.type = type;
                }
                catch(err) {
                    // Here we catch error in different cases for handling getObject function
                    // Such an error is thrown when the model is OData v4 because the getObject
                    // throws error.
                    console.warn("UI5 Inspector: ", err);

                }

                return modelInfo;
            },

            /**
             * Helper to format input for _getModelInfo-function based on binding information.
             *
             * @param {Object} binding
             * @param {string} bindingInfo
             * @returns {Object}
             * @private
             */
            _getModelInfoFromBinding: function (binding, bindingInfo) {
                return this._getModelInfo(binding.getContext() || binding.getModel(), (bindingInfo.model ? bindingInfo.model + '>' : '') + bindingInfo.path);
            },

            /**
             * Creates an object with the context model of a UI5 control.
             * @param {Object} control
             * @param {string} controlProperty
             * @returns {Object}
             * @private
             */
            _getModelFromContext: function (control, controlProperty) {
                var bindingInfo = control.getBindingInfo(controlProperty);
                var binding = bindingInfo.binding;
                var bindingParts = binding.getBindings && binding.getBindings();
                var model = {};

                if(bindingInfo.parts) {
                    // take care of multiple bindings of a property
                    model.parts = bindingInfo.parts.map(function (bindingInfoPart, index) {
                        var currentBinding = bindingParts && bindingParts[index] || binding;
                        return this._getModelInfoFromBinding(currentBinding, bindingInfoPart);
                    }.bind(this));
                } else {
                    model = this._getModelInfoFromBinding(binding, bindingInfo);
                }

                return model;
            },

            /**
             * Creates an object with the properties bindings of a UI5 control.
             * @param {Object} control
             * @returns {Object}
             * @private
             */
            _getBindDataForProperties: function (control) {
                var properties = control.getMetadata().getAllProperties();
                var propertiesBindingData = Object.create(null);

                for (var key in properties) {
                    if (properties.hasOwnProperty(key) && control.getBinding(key)) {
                        var binding = control.getBinding(key);
                        var bindingInfo = control.getBindingInfo(key);
                        propertiesBindingData[key] = Object.create(null);
                        // When we have composite binding getPath() function throws error so we need to check if this is the case.
                        propertiesBindingData[key].path = bindingInfo.parts ? "" : binding.getPath();
                        propertiesBindingData[key].value = binding.getValue();
                        propertiesBindingData[key].formattedValue = control.getProperty(key);
                        propertiesBindingData[key].type =
                            control.getMetadata().getProperty(key) &&
                            control.getMetadata().getProperty(key).getType() &&
                            control.getMetadata().getProperty(key).getType().getName ? control.getMetadata().getProperty(key).getType().getName() : '';
                        propertiesBindingData[key].mode = binding.getBindingMode();
                        propertiesBindingData[key].model = this._getModelFromContext(control, key);
                    }
                }

                return propertiesBindingData;
            },

            /**
             * Creates an object with the agregations bindings of a UI5 control.
             * @param {Object} control
             * @returns {Object}
             * @private
             */
            _getBindDataForAggregations: function (control) {
                var aggregations = control.getMetadata().getAllAggregations();
                var aggregationsBindingData = Object.create(null);

                for (var key in aggregations) {
                    if (aggregations.hasOwnProperty(key) && control.getBinding(key)) {
                        aggregationsBindingData[key] = Object.create(null);
                        aggregationsBindingData[key].model = this._getModelFromContext(control, key);
                    }
                }

                return aggregationsBindingData;
            },

            /**
             * Creates an object with a parts array containing all binding contexts for the given control.
             * ATTENTION: This function makes use of internal variables to retrieve the required information.
             * TODO: Is this possible without accessing internals?
             *
             * @param {Object} control
             * @returns {Object}
             * @private
             */
            _getBindingContextsForControl: function(control) {
                var bindingContexts = jQuery.extend({},
                    control.oPropagatedProperties && control.oPropagatedProperties.oBindingContexts,
                    control.oBindingContexts,
                    control.mElementBindingContexts
                );
                // reduce object to non-empty contexts
                bindingContexts = Object.keys(bindingContexts).reduce(function(finalContexts, key) {
                    if(bindingContexts[key]) {
                        finalContexts[key] = bindingContexts[key];
                    }
                    return finalContexts;
                }, {});
                if (bindingContexts && Object.keys(bindingContexts).length) {
                    return {
                        parts: Object.keys(bindingContexts).map(function (key) {
                            return controlInformation._getModelInfo(bindingContexts[key].getModel(),
                                (key && key !== 'undefined' && key !== 'null' ? key + '>' : '') + bindingContexts[key].getPath());
                        })
                    };
                }
                return null;
            },

        };

        // ================================================================================
        // Public API
        // ================================================================================

        /**
         * Global object that provide common information for all support tools
         * @type {{getFrameworkInformation: Function, getRenderedControlTree: Function, getControlProperties: Function, getControlBindingInformation: Function}}
         */
        return {

            /**
             * Common information about the framework
             * @returns {*}
             */
            getFrameworkInformation: _getFrameworkInformation,

            /**
             * Array model of the rendered control as a tree.
             * @returns {Array}
             */
            getRenderedControlTree: function () {
                var renderedControlTreeModel = [];
                controlTree._createRenderedTreeModel(document.body, renderedControlTreeModel);

                return renderedControlTreeModel;
            },

            /**
             * Gets all control properties.
             * @param {string} controlId
             * @returns {Object}
             */
            getControlProperties: function (controlId) {
                return controlInformation._getProperties(controlId);
            },

            /**
             * Gets control binding information.
             * @param {string} controlId
             * @returns {Object}
             */
            getControlBindings: function (controlId) {
                var result = Object.create(null);
                var control = sap.ui.getCore().byId(controlId);

                if (!control) {
                    return result;
                }

                result.meta = Object.create(null);
                result.meta.controlId = controlId;
                result.aggregations = controlInformation._getBindDataForAggregations(control);
                result.properties = controlInformation._getBindDataForProperties(control);
                result.context = controlInformation._getBindingContextsForControl(control);

                return result;
            }
        };

    });
