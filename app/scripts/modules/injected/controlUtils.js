'use strict';

/**
 * Create data object for the DataView to consume.
 * @param {Object} options - settings
 * @returns {Object}
 * @private
 */
function _assembleDataToView(options) {
    var object = Object.create(null);
    object.data = options.data ? options.data : Object.create(null);

    object.options = {
        controlId: options.controlId !== undefined ? options.controlId : undefined,
        expandable: options.expandable !== undefined ? options.expandable : true,
        expanded: options.expanded !== undefined ? options.expanded : true,
        hideTitle: options.hideTitle !== undefined ? options.hideTitle : false,
        showTypeInfo: !!options.showTypeInfo,
        title: options.title !== undefined ? options.title : '',
        editableValues: options.editableValues !== undefined ? options.editableValues : true
    };

    return object;
}

/**
 * Create a clickable value for the DataView.
 * @param {Object} options
 * @constructor
 */
function ClickableValue(options) {
    // This is used for checking in the dataView
    this._isClickableValueForDataView = true;
    // This is shown in the data view
    this.value = '<clickable-value key="' + options.key + '" parent="' + options.parent + '">' + options.value || '' + '</clickable-value>';
    // This data is attached in the click event of the dataview
    this.eventData = options.eventData || {};
}

/**
 * Copies the properties of the sourceObject into the targetObject
 *
 * Remark: This is a simple alternative to jQuery.extend().
 *
 * @param {Object} targetObject
 * @param {Object} sourceObject
 * @private
 */
function _extendObject(targetObject, sourceObject) {
    Object.keys(sourceObject).forEach(
        function (propertyKey) {
            targetObject[propertyKey] = sourceObject[propertyKey];
        }
    );
}

/**
 * Creates a binding info object with the given path.
 *
 * If the path contains a model specifier (prefix separated with a '>'),
 * the <code>model</code> property is set as well and the prefix is
 * removed from the path.
 *
 * @param {String} path
 * @returns {object}
 * @private
 */
function _makeSimpleBindingInfo(path) {
    var index = path && path.indexOf('>') || -1;
    var bindingInfo = { path : path };

    if ( index > 0 ) {
        bindingInfo.model = path.slice(0, index);
        bindingInfo.path = path.slice(index + 1);
    }

    return bindingInfo;
}

/**
 * Create a reference to model information consisting of a reference to the model itself and
 * a path property for the concrete value at the defined path.
 *
 * @param {object} model
 * @param {string} parent - the parent in the tree provided for ClickableValue
 * @param {string} suffix - optional suffix to distinct multiple model entries
 * @returns {object}
 * @private
 */
function _assembleModelReferences(model, parent, suffix) {
    // collect all required data
    var data = { };
    // do not print null or undefined
    var modelKey = 'model' + (suffix ? suffix : '');
    var pathKey = 'path' + (suffix ? suffix : '');
    var bindingInfo = _makeSimpleBindingInfo(model.path);

    // add the model entry
    data[modelKey] = new ClickableValue({
        value: (bindingInfo.model || '') + ' (' + model.type + ')',
        eventData: {
            name: bindingInfo.model,
            type: model.type,
            mode: model.mode,
            data: model.modelData
        },
        parent: parent,
        key: modelKey
    });

    // add the path entry
    data[pathKey] = new ClickableValue({
        value: bindingInfo.path,
        eventData: {
            name: bindingInfo.model,
            type: model.type,
            path: bindingInfo.path,
            data: model.pathData
        },
        parent: parent,
        key: pathKey
    });

    return data;
}

/**
 * Create a reference to model information consisting of a reference to the model itself and
 * a path property for the concrete value at the defined path.
 *
 * The model parameter requires either:
 *  1. a model property containing the model instance and a path
 *  2. an array called parts that contains multiple entries in the format of 1.
 *
 * @param {object} model
 * @param {string} parent - the parent in the tree provided for ClickableValue
 * @returns {object}
 * @private
 */
function _assembleModelInfo(model, parent) {
    if (model) {
        if(model.parts && model.parts.length > 1) {
            // add multiple model entries for properties with multiple bindings
            return model.parts.reduce(function(prevValue, currValue, index) {
                _extendObject(prevValue, _assembleModelReferences(currValue, parent, '_' + index));
                return prevValue;
            }, {});
        } else {
            // add a single model entry
            return _assembleModelReferences(model.parts && model.parts[0] || model, parent);
        }
    }

    return null;
}

// ================================================================================
// Control Properties Info
// ================================================================================
var controlProperties = (function () {

    var OWN = 'own';
    var INHERITED = 'inherited';

    /**
     * Formatter for the inherited properties.
     * @param {string} controlId
     * @param {Object} properties - UI5 control properties
     * @private
     */
    function _formatInheritedProperties(controlId, properties) {

        if (!properties[INHERITED]) {
            return;
        }

        for (var i = 0; i < properties[INHERITED].length; i++) {
            var parent = properties[INHERITED][i];
            var title = parent.meta.controlName;
            var props = parent.properties;

            parent = _assembleDataToView({
                controlId: controlId,
                expandable: false,
                title: title
            });

            for (var key in props) {
                parent.data[key] = props[key].value;
            }

            var parentTitle = '<span gray>Inherits from</span>';
            parentTitle += ' (' + title + ')';
            parent.options.title = parentTitle;
            properties[INHERITED + i] = parent;
        }

        delete properties[INHERITED];
    }

    /**
     * Formatter for nested properties.
     * @param {Object} propertyObj
     * @param {string} title
     * @returns {Object}
     * @private
     */
    function _formatNestedProperties(propertyObj, title) {

        var nestedProperties = propertyObj.value;
        var props = _assembleDataToView({
            title: title,
            expandable: false,
            showTypeInfo: true
        });

        for (var key in nestedProperties) {
            props.data[key] = nestedProperties[key];
        }

        return props;
    }

    /**
     * Getter for the properties' associations.
     * @param {string} controlId
     * @param {Object} properties
     * @private
     */
    function _getControlPropertiesAssociations(controlId, properties) {
        var control = sap.ui.getCore().byId(controlId);

        if (!control) {
            return;
        }

        properties.associations = Object.create(null);

        var controlAssociations = control.getMetadata().getAssociations();
        var genericObject = Object.create(null);

        Object.keys(controlAssociations).forEach(function (key) {
            var associationElement = control.getAssociation(key);
            if (associationElement && associationElement.length) {
                genericObject.name = associationElement;
            }

            genericObject.type = controlAssociations[key].type;
            properties.associations[key] = genericObject;
        });

    }

    /**
     * Formatter for the associations.
     * @param {Object} properties
     * @private
     */
    function _formatAssociations(properties) {
        var associations = properties.associations;

        for (var assoc in associations) {
            var associationsValue = '';
            if (associations[assoc].name) {
                associationsValue += associations[assoc].name + ' ';
            }
            associationsValue += associations[assoc].type;
            associationsValue += ' (associations)';
            associations[assoc] = associationsValue;
        }
    }

    /**
     * Formatter function for the control properties data.
     * @param {string} controlId
     * @param {Object} properties
     * @returns {Object}
     * @private
     */
    var _formatControlProperties = function (controlId, properties) {

        if (Object.keys(properties).length === 0) {
            return properties;
        }

        var title = properties[OWN].meta.controlName;
        var props = properties[OWN].properties;

        for (var key in props) {
            if (props[key].type === 'object') {
                props[key] = _formatNestedProperties(props[key], key);
                continue;
            }

            props[key] = props[key].value;
        }

        properties[OWN] = _assembleDataToView({
            controlId: controlId,
            expandable: false,
            title: title
        });
        properties[OWN].data = props;
        properties[OWN].options.title = '#' + controlId + ' <span gray>(' + title + ')</span>';

        _formatInheritedProperties(controlId, properties);
        _getControlPropertiesAssociations(controlId, properties[OWN]);
        _formatAssociations(properties[OWN]);

        return properties;
    };

    return {
        formatControlProperties: _formatControlProperties
    };
}());

// ================================================================================
// Binding Info
// ================================================================================
var controlBindings = (function () {

    /**
     *
     * @param {Object} initialControlBindingData - ToolsAPI.getControlBindings()
     * @param {Object} resultControlBindingData
     * @private
     */
    var _getControlContextPathFormattedForDataView = function (initialControlBindingData, resultControlBindingData) {
        if (initialControlBindingData.contextPath) {
            resultControlBindingData.contextPath = _assembleDataToView({
                title: 'Binding context',
                expandable: false,
                editableValues: false,
                data: _assembleModelInfo(initialControlBindingData.model, 'contextPath')
            });
        }
    };

    /**
     *
     * @param {Object} initialControlBindingData - ToolsAPI.getControlBindings()
     * @param {Object} resultControlBindingData
     * @private
     */
    var _getControlPropertiesFormattedForDataView = function (initialControlBindingData, resultControlBindingData) {
        if (!initialControlBindingData.properties) {
            return;
        }

        for (var key in initialControlBindingData.properties) {
            var model = initialControlBindingData.properties[key].model;
            var properties = initialControlBindingData.properties[key];
            var data = {
                value: properties.value,
                formatted: properties.formattedValue,
                type: properties.type,
                mode: properties.mode
            };

            _extendObject(data, _assembleModelInfo(model, key));

            resultControlBindingData[key] = _assembleDataToView({
                title: key + ' <opaque>(property)</opaque>',
                expandable: false,
                editableValues: false,
                data: data
            });
        }
    };

    /**
     *
     * @param {Object} initialControlBindingData - ToolsAPI.getControlBindingData()
     * @param {Object} resultControlBindingData
     * @private
     */
    var _getControlAggregationsFormattedForDataView = function (initialControlBindingData, resultControlBindingData) {
        if (!initialControlBindingData.aggregations) {
            return;
        }

        for (var index in initialControlBindingData.aggregations) {
            var model = initialControlBindingData.aggregations[index].model;
            var data = _assembleModelInfo(model, index);

            resultControlBindingData[index] = _assembleDataToView({
                title: index + ' <opaque>(aggregation)</opaque>',
                expandable: false,
                editableValues: false,
                data: data
            });
        }
    };

    return {
        getControlContextPathFormattedForDataView: _getControlContextPathFormattedForDataView,
        getControlPropertiesFormattedForDataView: _getControlPropertiesFormattedForDataView,
        getControlAggregationsFormattedForDataView: _getControlAggregationsFormattedForDataView
    };

}());

// ================================================================================
// Public API
// ================================================================================
module.exports = {

    /**
     * Returns the entire control tree model.
     * @param {Array} controlTreeModel - ToolsAPI.getRenderedControlTree()
     * @param {Object} commonInformation - commonInformation property from ToolsAPI.getFrameworkInformation()
     * @returns {{versionInfo: {version: (string|*), framework: (*|string)}, controls: *}}
     */
    getControlTreeModel: function (controlTreeModel, commonInformation) {
        return {
            versionInfo: {
                version: commonInformation.version,
                framework: commonInformation.frameworkName
            },
            controls: controlTreeModel
        };
    },

    /**
     * Returns properties for control in a formatted way.
     * @param {string} controlId
     * @returns {Object}
     */
    getControlPropertiesFormattedForDataView: function (controlId, properties) {
        return controlProperties.formatControlProperties(controlId, properties);
    },

    /**
     * Reformat all information needed for visualizing the control bindings.
     * @param {Object} controlBindingData - ToolsAPI.getControlBindingData()
     * @returns {Object}
     */
    getControlBindingsFormattedForDataView: function (controlBindingData) {
        var resultControlBindingData = Object.create(null);

        controlBindings.getControlContextPathFormattedForDataView(controlBindingData, resultControlBindingData);
        controlBindings.getControlPropertiesFormattedForDataView(controlBindingData, resultControlBindingData);
        controlBindings.getControlAggregationsFormattedForDataView(controlBindingData, resultControlBindingData);

        return resultControlBindingData;
    }
};
