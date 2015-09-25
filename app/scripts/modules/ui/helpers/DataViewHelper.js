'use strict';

/**
 * Generates attributes in HTML.
 * @param {Object} attributes
 * @returns {string}
 * @private
 */
function _generateTagAttributes(attributes) {

    var html = '';
    if (attributes) {
        for (var key in attributes) {
            html += ' ' + key + '="' + attributes[key] + '"';
        }
    }
    return html;
}

/**
 * @param {Object} attributes
 * @returns {string}
 * @private
 */
function _openUL(attributes) {
    var html = '';
    var attributesHTML = _generateTagAttributes(attributes);

    html = '<ul' + attributesHTML + '>';
    return html;
}

/**
 * Create "ul" closing tag.
 * @returns {string}
 * @private
 */
function _closeUL() {
    return '</ul>';
}

/**
 * Create "li" opening tag.
 * @returns {string}
 * @private
 */
function _openLI() {
    return '<li>';
}

/**
 * Create "li" closing tag.
 * @returns {string}
 * @private
 */
function _closeLI() {
    return '</li>';
}

/**
 * @param {Object|Array} element
 * @returns {number}
 * @private
 */
function _getObjectLength(element) {

    if (element && typeof element === 'object') {
        return Object.keys(element).length;
    }

    return 0;
}

/**
 * @param {boolean} isExpanded - configures the direction of the arrow
 * @returns {string}
 * @private
 */
function _addArrow(isExpanded) {
    var direction = isExpanded ? 'down' : 'right';
    return '<arrow ' + direction + '="true"></arrow>';
}

/**
 * @param {string} tag - name of HTML tag
 * @param {string|number|boolean} value
 * @param {Object} attributes
 * @returns {string}
 * @private
 */
function _wrapInTag(tag, value, attributes) {
    var html = '';

    if (!tag || typeof tag !== 'string') {
        return html;
    }

    html += '<' + tag;
    html += _generateTagAttributes(attributes);
    html += '>' + value + '</' + tag + '>';
    return html;
}

/**
 * Check if property value needs quotes.
 * @param {string|boolean|number|null} value
 * @param {string} valueWrappedInHTML
 * @returns {string|boolean|number|null}
 * @private
 */
function _valueNeedsQuotes(value, valueWrappedInHTML) {

    if (typeof value === 'string') {
        return '&quot;' + valueWrappedInHTML + '&quot;';
    }

    return valueWrappedInHTML;
}

/**
 * @param {Array|Object} element
 * @returns {string}
 * @private
 */
function _addKeyTypeInfo(element) {

    if (Array.isArray(element)) {
        return ':&nbsp;' + '[' + _getObjectLength(element) + ']';
    }

    if (!_getObjectLength(element.data)) {
        return ':&nbsp;' + '{}';
    }

    return ':&nbsp;' + '{';
}

/**
 * Search for the nearest parent Node within the bounds of the DATA-VIEW parent.
 * @param {element} element - HTML DOM element that will be the root of the search
 * @param {string} targetElementName - The desired HTML parent element nodeName
 * @returns {Object} HTML DOM element
 * @private
 */
function _findNearestDOMElement(element, targetElementName) {
    while (element.nodeName !== targetElementName) {
        if (element.nodeName === 'DATA-VIEW') {
            element = undefined;
            break;
        }
        element = element.parentNode;
    }

    return element;
}

/**
 * @param {element} target - HTML DOM element
 * @private
 */
function _toggleCollapse(target) {
    var expandableLISibling = target.nextElementSibling;
    var arrow = target.querySelector('arrow');

    if (!arrow) {
        return;
    }

    if (arrow.getAttribute('right') === 'true') {
        arrow.removeAttribute('right');
        arrow.setAttribute('down', 'true');

        expandableLISibling.setAttribute('expanded', 'true');
    } else if (arrow.getAttribute('down') === 'true') {
        arrow.removeAttribute('down');
        arrow.setAttribute('right', 'true');
        expandableLISibling.removeAttribute('expanded');
    }
}

/**
 * Get the needed attributes for an opening UL tag.
 * @param {Object} options
 * @returns {Object}
 * @private
 */
function _getULAttributesFromOptions(options) {
    var attributes = {};

    if (options.expandable) {
        attributes.expandable = 'true';
    }

    if (options.expanded) {
        attributes.expanded = 'true';
    }

    return attributes;
}

/**
 * Appropriately wraps in HTML the No Available Data text.
 * @param {string} html
 * @returns {string}
 * @private
 */
function _getNoDataHTML(html) {
    var htmlString = '';
    htmlString += _openUL({
        'expanded': 'true'
    });
    htmlString += _openLI();
    htmlString += html;
    htmlString += _closeLI();
    htmlString += _closeUL();

    return htmlString;
}

/**
 * This function selects the content of an editable value holder.
 * @param {HTMLElement} element
 * @param {boolean} shouldSelect
 * @returns {Range} range the range that is selected
 * @private
 */
function _selectEditableContent(element, shouldSelect) {
    if (shouldSelect) {
        var range = document.createRange();
        range.selectNodeContents(element);
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        return range;
    }
}

/**
 *
 * @param {string} key
 * @param {Object} currentElement
 * @returns {Object}
 * @private
 */
function _formatValueForDataView(key, currentElement) {
    var requiredFormat = {
        data: {}
    };
    requiredFormat.data[key] = currentElement.value;

    return requiredFormat;
}

/**
 * Determines if value is boolean, number or string.
 * @param {string|number|boolean} value
 * @returns {boolean|string|number}
 * @private
 */
function _getCorrectedValue(value) {

    if (value === 'true' || value === 'false') {
        value = (value === 'true');
    } else if (value === '') {
        value = null;
    } else if (!isNaN(+value) && value !== null) {
        value = +value;
    }

    return value;
}

module.exports = {
    addArrow: _addArrow,
    addKeyTypeInfo: _addKeyTypeInfo,
    closeLI: _closeLI,
    closeUL: _closeUL,
    findNearestDOMElement: _findNearestDOMElement,
    formatValueForDataView: _formatValueForDataView,
    getCorrectedValue: _getCorrectedValue,
    getObjectLength: _getObjectLength,
    getULAttributesFromOptions: _getULAttributesFromOptions,
    getNoDataHTML: _getNoDataHTML,
    openUL: _openUL,
    openLI: _openLI,
    selectEditableContent: _selectEditableContent,
    toggleCollapse: _toggleCollapse,
    wrapInTag: _wrapInTag,
    valueNeedsQuotes: _valueNeedsQuotes
};
