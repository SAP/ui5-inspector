'use strict';

/**
 * Returns the HTML for the divider.
 * @returns {string}
 * @private
 */
function _getResizeHolderHTML() {
    return '<divider><handler class="resize-handler"></handler></divider>';
}

/**
 * Manage the display style of the start container.
 * @param {elements} _splitterInstance
 * @param {boolean} skipSizing
 * @private
 */
function _applyInlineStylesForStartContainer(_splitterInstance, skipSizing) {
    var $start = _splitterInstance._$startElement;

    $start.style.display = _splitterInstance._hideStartContainer ? 'none' : '';
    if (!skipSizing) {
        $start.style.width = _splitterInstance._startContainerWidth || undefined;
        $start.style.height = _splitterInstance._startContainerHeight || undefined;
    }
}

/**
 * Manage the display style of the end container.
 * @param {elements} _splitterInstance
 * @param {boolean} skipSizing
 * @private
 */
function _applyInlineStylesForEndContainer(_splitterInstance, skipSizing) {
    var $end = _splitterInstance._$endElement;

    $end.style.display = _splitterInstance._hideEndContainer ? 'none' : '';
    if (!skipSizing) {
        $end.style.width = _splitterInstance._endContainerWidth || undefined;
        $end.style.height = _splitterInstance._endContainerHeight || undefined;
    }
}

/**
 * Manage the display style of a close button.
 * @param {element} _splitterInstance
 * @private
 */
function _applyInlineStylesForCloseButton(_splitterInstance) {
    var $closeButton = _splitterInstance._$endElement.querySelector(':scope > close-button');

    if ($closeButton) {
        if (_splitterInstance._hideEndContainer) {
            $closeButton.style.display = 'none';
        } else {
            $closeButton.style.display = 'block';
        }
    }
}

/**
 *
 * @param {element} _splitterInstance
 * @param {boolean} _skipSizing
 * @private
 */
function _applyInlineStyles(_splitterInstance, _skipSizing) {
    var that = _splitterInstance;
    var $end = that._$endElement;
    var skipSizing = _skipSizing || false;

    if (that._isEndContainerClosable) {
        $end.setAttribute('verticalScrolling', 'true');
    }

    if (that._endContainerTitle) {
        $end.setAttribute('withHeader', 'true');
    }

    _applyInlineStylesForStartContainer(_splitterInstance, skipSizing);
    _applyInlineStylesForEndContainer(_splitterInstance, skipSizing);
    _applyInlineStylesForCloseButton(_splitterInstance);
}

/**
 *
 * @param {element} splitterInstance
 * @private
 */
function _createEndContainerHeader(splitterInstance) {
    var endContainerHeader = document.createElement('header');
    endContainerHeader.innerHTML = splitterInstance._endContainerTitle;

    splitterInstance._$endElement.appendChild(endContainerHeader);
}

/**
 *
 * @param {element} splitterInstance
 * @private
 */
function _createCloseButton(splitterInstance) {
    var closeButtonElement = document.createElement('close-button');
    splitterInstance._$endElement.appendChild(closeButtonElement);

    closeButtonElement.onclick = splitterInstance.hideEndContainer.bind(splitterInstance);
}

/**
 * The complete Splitter Options.
 * @typedef {Object} splitterOptions
 * @property {boolean} hideStartContainer - the start dom element will not be rendered (display: none)
 * @property {boolean} hideEndContainer - the end dom element will not be rendered (display: none)
 * @property {boolean} isEndContainerClosable - additional close-button for closing the end element
 * @property {string} startContainerWidth - custom width of the start element
 * @property {string} startContainerHeight - custom height of the start element
 * @property {string} endContainerWidth - custom width of the end element
 * @property {string} endContainerHeight - custom height of the end element
 */

/**
 * Splitter component.
 * @param {string} domId
 * @param {splitterOptions} options
 * @constructor
 */
function SplitContainer(domId, options) {
    this._setReferences(domId);

    /**
     * If options is given and hideStartContainer is true the start (dom) element of the splitter will be hidden (display: none).
     * @type {boolean}
     * @private
     */
    this._hideStartContainer = options && options.hideStartContainer;
    /**
     * If options is given and hideStartContainer is true the end (dom) element of the splitter will be hidden (display: none).
     * @type {boolean}
     * @private
     */
    this._hideEndContainer = options && options.hideEndContainer;
    /**
     * Shows a close button for the end (dom) element of the splitter.
     * @type {boolean}
     * @private
     */
    this._isEndContainerClosable = options && options.isEndContainerClosable;
    /**
     * Set the width and height of the splitter start and end elements.
     */
    this._startContainerWidth = options && options.startContainerWidth ? options.startContainerWidth : undefined;
    this._startContainerHeight = options && options.startContainerHeight ? options.startContainerHeight : undefined;
    this._endContainerWidth = options && options.endContainerWidth ? options.endContainerWidth : undefined;
    this._endContainerHeight = options && options.endContainerHeight ? options.endContainerHeight : undefined;
    this._endContainerTitle = options && options.endContainerTitle ? options.endContainerTitle : undefined;

    _applyInlineStyles(this);

    if (this._endContainerTitle) {
        _createEndContainerHeader(this);
    }

    if (this._isEndContainerClosable) {
        _createCloseButton(this);
    }

    /** @type {boolean}*/
    this.isVerticalSplitter = this.$this.getAttribute('orientation') === 'vertical';

    /**
     * Place the resize holder HTML right after the 'start' element
     */
    this._$startElement.insertAdjacentHTML('afterend', _getResizeHolderHTML());

    this.$this.querySelector(':scope > divider > handler').onmousedown = this._mouseDownHandler.bind(this);
}

/**
 * Hide end container.
 */
SplitContainer.prototype.hideEndContainer = function () {
    this._hideEndContainer = true;
    _applyInlineStyles(this, true);
};

/**
 * Show end container.
 */
SplitContainer.prototype.showEndContainer = function () {
    this._hideEndContainer = false;
    _applyInlineStyles(this, true);
};

/**
 * Handler for mousemove.
 * @param {Object} event
 * @private
 */
SplitContainer.prototype._mouseMoveHandler = function (event) {
    var splitContainerRect = this.$this.getBoundingClientRect();

    if (this.isVerticalSplitter) {
        this._$endElement.style.height = (splitContainerRect.top + splitContainerRect.height - event.clientY) + 'px';
    } else {
        this._$endElement.style.width = (splitContainerRect.left + splitContainerRect.width - event.clientX) + 'px';
    }
};

/**
 * Handler for onmouseup.
 * @private
 */
SplitContainer.prototype._mouseUpHandler = function () {
    this.$this.onmousemove = null;
    document.body.classList.remove('user-is-resizing-vertically');
    document.body.classList.remove('user-is-resizing-horizontally');
};

/**
 * Handler for onmousedown.
 * @param {Object} event
 * @private
 */
SplitContainer.prototype._mouseDownHandler = function (event) {
    var that = this;

    event.preventDefault();
    event.stopPropagation();

    // Add class to disable selection of dom elements while dragging
    if (that.isVerticalSplitter) {
        document.body.classList.add('user-is-resizing-vertically');
    } else {
        document.body.classList.add('user-is-resizing-horizontally');
    }

    /**
     * Handler for onmousemove.
     * @param {Object} event
     */
    that.$this.onmousemove = function (event) {
        window.requestAnimationFrame(that._mouseMoveHandler.bind(that, event));
    };

    that.$this.onmouseup = that._mouseUpHandler.bind(that);
};

/**
 * Save references for SplitContainer different HTML elements.
 * @private
 */
SplitContainer.prototype._setReferences = function (domId) {
    this.$this = document.getElementById(domId);
    this._$endElement = this.$this.querySelector(':scope > end');
    this._$startElement = this.$this.querySelector(':scope > start');
};

module.exports = SplitContainer;
