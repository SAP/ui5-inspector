'use strict';

var JSONFormatter = require('../ui/JSONFormatter');
var DVHelper = require('../ui/helpers/DataViewHelper');

/** @property {Object} data - Object in the following format:
 *  {
 *      object1: {
            associations: 'Object' containing all the associations for the control
            options: 'Object' containing the configuration for dataview
 *                      controlId: 'string'
 *                      expandable:'boolean',
 *                      expanded:'boolean',
 *                      title:'string',
 *                      showTypeInfo:'boolean', default is false
 *                      showTitle: 'boolean' default is true
 *                      editableValues: 'boolean' default is true
 *           data:'Object' with all the data to be represented visually
 *      },
 *  }
 *
 * If there is an object in the data section you have to repeat the object1 structure to be properly represented
 */

/**
 * @param {string} target - id of the DOM container
 * @param {Object} options - initial configuration
 * @constructor
 */
function DataView(target, options) {

    this._DataViewContainer = document.getElementById(target);

    // Initialize event handlers for editable fields
    this._onClickHandler();
    this._onEnterHandler();

    // When the field is editable this flag shows whether the value should be selected
    this._selectValue = true;

    /**
     * Method fired when the clicked element is an editable.
     * @param {Object} changedData - with the id of the selected control, property name and the new value
     */
    this.onPropertyUpdated = function (changedData) {
    };

    /**
     * Method fired when a clickable element is clicked.
     * @param {Object} event
     */
    this.onValueClick = function (event) {
    };

    if (options) {

        this.onPropertyUpdated = options.onPropertyUpdated || this.onPropertyUpdated;

        this.onValueClick = options.onValueClick || this.onValueClick;

        options.data ? this.setData(options.data) : undefined;
    }
}

/**
 * @param {Object} data - object structure as HTML
 */
DataView.prototype.setData = function (data) {

    if (typeof data !== 'object') {
        return;
    }

    this._data = data;
    this._generateHTML();
};

/**
 * Get data model.
 * @returns {Object}
 */
DataView.prototype.getData = function () {
    return this._data;
};

/**
 * Checks if any of the view objects contain any data to present.
 * @returns {boolean}
 * @private
 */
DataView.prototype._isDataEmpty = function () {
    var viewObjects = this.getData();
    var isEmpty = true;

    if (!viewObjects) {
        return isEmpty;
    }

    for (var key in viewObjects) {
        if (DVHelper.getObjectLength(viewObjects[key].data)) {
            isEmpty = false;
            break;
        }
    }

    return isEmpty;
};

/**
 * Generates HTML string from an object.
 * @param {string} key
 * @param {Object|Array} currentElement
 * @returns {string}
 * @private
 */
DataView.prototype._generateHTMLFromObject = function (key, currentElement) {
    var html = '';
    var tag = 'key';

    var options = currentElement.options;

    if (options.title) {
        key = options.title;
        tag = 'section-title';
    }

    if (DVHelper.getObjectLength(currentElement) && options.expandable) {
        html += DVHelper.addArrow(options.expanded);
    }

    html += DVHelper.wrapInTag(tag, key, {});

    if (options.showTypeInfo) {

        if (!options.hideTitle) {
            html += ':&nbsp;';
        }

        html += DVHelper.addKeyTypeInfoBegin(currentElement.data);
    }

    return html;
};

/**
 * Appends or skips the closing bracket for Object type.
 * @param {Object} currentElement - current element to present
 * @returns {string}
 * @private
 */
DataView.prototype._generateHTMLForEndOfObject = function (currentElement) {
    var html = '';

    if (currentElement.options.showTypeInfo) {
        html += DVHelper.addKeyTypeInfoEnd(currentElement.data);
    }

    return html;
};

/**
 * Generates HTML string for a key value pair.
 * @param {string} key
 * @param {Object} currentView
 * @returns {string}
 * @private
 */
DataView.prototype._generateHTMLForKeyValuePair = function (key, currentView) {
    var html = '';
    var value = currentView.data[key];
    var options = currentView.options;
    var type = currentView.types ? currentView.types[key] : '';
    var attributes = {};
    var valueHTML;

    if (options && options.editableValues) {
        attributes = {
            'contentEditable': options.editableValues,
            'data-control-id': options.controlId,
            'data-property-name': key
        };
    }

    if (value && typeof value === 'object') {
        valueHTML = JSONFormatter.formatJSONtoHTML(value);
    } else if (typeof type === 'object') {
        valueHTML = DVHelper.wrapInSelectTag(value, attributes, type);
    } else if (type === 'boolean') {
        valueHTML = DVHelper.wrapInCheckBox(value, attributes);
    } else {
        valueHTML = DVHelper.valueNeedsQuotes(value, DVHelper.wrapInTag('value', value, attributes));
    }

    html += DVHelper.wrapInTag('key', key) + ':&nbsp;' + valueHTML;

    return html;
};

/**
 * Generates a HTML string for one of the sections in the supplied object to be viewed.
 * @param {Object} viewObject
 * @returns {string}
 * @private
 */
DataView.prototype._generateHTMLSection = function (viewObject) {
    var data = viewObject.data;
    var associations = viewObject.associations;
    var html = '';
    var options = viewObject.options;
    var isDataArray = Array.isArray(data);
    var lastArrayElement = data.length - 1;

    html += DVHelper.openUL(DVHelper.getULAttributesFromOptions(options));

    for (var key in data) {
        html += DVHelper.openLI();

        var currentElement = data[key];

        // Additional check for currentElement mainly to go around null values errors
        if (currentElement && currentElement.options) {
            html += this._generateHTMLFromObject(key, currentElement);
            html += this._generateHTMLSection(currentElement);
            html += this._generateHTMLForEndOfObject(currentElement);
        } else if (currentElement && currentElement._isClickableValueForDataView) {
            html += this._generateHTMLForKeyValuePair(key, DVHelper.formatValueForDataView(key, currentElement));
        } else {
            html += this._generateHTMLForKeyValuePair(key, viewObject);
        }

        if (isDataArray && key < lastArrayElement) {
            html += ',';
        }

        html += DVHelper.closeLI();
    }

    for (var name in associations) {
        var currentAssociation = associations[name];
        html += DVHelper.openLI();
        html += DVHelper.wrapInTag('key', name) + ':&nbsp;' + DVHelper.wrapInTag('value', currentAssociation);
        html += DVHelper.closeLI();
    }

    html += DVHelper.closeUL();
    return html;
};

/**
 * Transform predefined Object to HTML.
 * @private
 */
DataView.prototype._generateHTML = function () {
    var viewObjects = this.getData();
    var html = '';
    var noAvailableData = DVHelper.wrapInTag('no-data', 'No Available Data');

    if (this._isDataEmpty()) {
        this._DataViewContainer.innerHTML = noAvailableData;
        return;
    }

    // Go trough all the objects on the top level in the data structure and
    // skip the ones that does not have anything to display
    for (var key in viewObjects) {
        var currentObject = viewObjects[key];

        if (!DVHelper.getObjectLength(currentObject.data)) {
            html += this._addSectionTitle(currentObject, DVHelper.getNoDataHTML(noAvailableData));
            continue;
        }

        html += this._addSectionTitle(currentObject, this._generateHTMLSection(currentObject));
    }

    this._DataViewContainer.innerHTML = html;
};

/**
 * Adds a title to a section from a view object when transformed to HTML.
 * @param {Object} config
 * @param {string} htmlPart
 * @returns {string}
 * @private
 */
DataView.prototype._addSectionTitle = function (config, htmlPart) {
    var html = '';
    var options = config.options;

    if (options.hideTitle) {
        return htmlPart;
    }

    html += DVHelper.openUL(DVHelper.getULAttributesFromOptions(options));
    html += DVHelper.openLI();

    if (config.options.expandable) {
        html += DVHelper.addArrow(options.expanded);
    }

    html += DVHelper.wrapInTag('section-title', options.title);
    html += htmlPart;
    html += DVHelper.closeLI();
    html += DVHelper.closeUL();

    return html;
};

/**
 * @param {HTMLElement} element
 * @returns {boolean} if value is editable
 * @private
 */
DataView.prototype._isEditableValue = function (element) {
    return element.nodeName === 'VALUE' && element.contentEditable === 'true';
};

/**
 * Mouse click event handler for the editable values.
 * @private
 */
DataView.prototype._onClickHandler = function () {
    var that = this;

    /**
     * Handler for mouse click.
     * @param {Object} event
     */
    this._DataViewContainer.onclick = function (event) {
        var targetElement = event.target;
        var target = DVHelper.findNearestDOMElement(targetElement, 'LI');

        if (!target) {
            return;
        }

        DVHelper.toggleCollapse(target);

        if (that._isEditableValue(targetElement)) {
            that._onBlurHandler(targetElement);
            DVHelper.selectEditableContent(targetElement, that._selectValue);
            that._selectValue = false;
        }

        if (targetElement.nodeName === 'CLICKABLE-VALUE') {
            var attributes = event.target.attributes;
            var key = attributes.key.value;
            var parent = attributes.parent.value;
            var eventData = DVHelper.getObjectProperty(that.getData()[parent].data, key).eventData;

            that.onValueClick({
                target: key,
                data: eventData
            });
        }

        if (targetElement.nodeName === 'SELECT') {
            that._onChangeHandler(targetElement);
        }

        if (targetElement.nodeName === 'INPUT') {
            that._onCheckBoxHandler(targetElement);
        }
    };
};

/**
 * Enter button event handler for the editable values.
 * @private
 */
DataView.prototype._onEnterHandler = function () {
    var that = this;

    /**
     * Handler for key down.
     * @param {Object} e
     */
    this._DataViewContainer.onkeydown = function (e) {
        if (!that._isEditableValue(e.target)) {
            return;
        }

        that._onBlurHandler(e.target);
        DVHelper.selectEditableContent(e.target, that._selectValue);
        that._selectValue = false;

        if (e.keyCode === 13) {
            e.preventDefault();
            document.getSelection().empty();
            e.target.blur();
        }
    };
};

/**
 * Blur event handler for the editable values.
 * @param {element} target - HTML DOM element
 * @private
 */
DataView.prototype._onBlurHandler = function (target) {
    var that = this;

    if (!target) {
        return;
    }

    /**
     * Handler for blur event.
     * @param {Object} e
     */
    target.onblur = function (e) {
        var propertyData = {};
        var target = e.target;
        var propertyName;
        var value;

        propertyData.controlId = target.getAttribute('data-control-id');

        propertyName = target.getAttribute('data-property-name');
        propertyData.property = propertyName.charAt(0).toUpperCase() + propertyName.slice(1);

        value = target.textContent.trim();
        propertyData.value = DVHelper.getCorrectedValue(value);

        that.onPropertyUpdated(propertyData);

        target.removeEventListener('onblur', this);
        that._selectValue = true;
    };
};

/**
 * Change event handler for the selectable values.
 * @param {element} target - HTML DOM element
 * @private
 */
DataView.prototype._onChangeHandler = function (target) {
    var that = this;

    if (!target) {
        return;
    }

    /**
     * Handler for change event.
     * @param {Object} e
     */
    target.onchange = function (e) {
        var propertyData = {};
        var target = e.target;
        var propertyName;
        var value;

        propertyData.controlId = target.getAttribute('data-control-id');

        propertyName = target.getAttribute('data-property-name');
        propertyData.property = propertyName.charAt(0).toUpperCase() + propertyName.slice(1);

        value = target.selectedOptions[0].value;
        propertyData.value = DVHelper.getCorrectedValue(value);

        that.onPropertyUpdated(propertyData);

        target.removeEventListener('onchange', this);
        that._selectValue = true;
    };
};

/**
 * Change event handler for the boolean values.
 * @param {element} target - HTML DOM element
 * @private
 */
DataView.prototype._onCheckBoxHandler = function (target) {
    var that = this;

    if (!target) {
        return;
    }

    /**
     * Handler for change event.
     * @param {Object} e
     */
    target.onchange = function (e) {
        var propertyData = {};
        var propertyName;
        var target = e.target;

        propertyData.controlId = target.getAttribute('data-control-id');

        propertyName = target.getAttribute('data-property-name');
        propertyData.property = propertyName.charAt(0).toUpperCase() + propertyName.slice(1);

        propertyData.value = target.checked;

        that.onPropertyUpdated(propertyData);

        target.removeEventListener('onchange', this);
        that._selectValue = true;
    };
};

module.exports = DataView;
