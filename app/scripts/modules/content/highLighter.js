'use strict';

// Reference for the highlighter DOM element
var _highLighter = null;

/**
 * Hide the highlighter.
 * @private
 */
function _hideHighLighter() {
    _highLighter.style.display = 'none';
}

/**
 * Show the highlighter.
 * @private
 */
function _showHighLighter() {
    _highLighter.style.display = 'block';
}

/**
 * Create DOM element for visual highlighting.
 * @private
 */
function _createHighLighter() {
    if (document.getElementById('ui5-highlighter')) {
        return;
    }

    var hightLighter = document.createElement('div');
    hightLighter.style.cssText = 'box-sizing: border-box;border:1px solid blue;background: rgba(20, 20, 200, 0.4);position: absolute';

    var hightLighterWrapper = document.createElement('div');
    hightLighterWrapper.id = 'ui5-highlighter';
    hightLighterWrapper.style.cssText = 'position: fixed;top:0;right:0;bottom:0;left:0;z-index: 1000;overflow: hidden;';
    hightLighterWrapper.appendChild(hightLighter);

    document.body.appendChild(hightLighterWrapper);

    // Save reference for later usage
    _highLighter = document.getElementById('ui5-highlighter');

    // Add event handler
    _highLighter.onmouseover = _hideHighLighter;
}

/**
 * Highlight controls.
 * @type {{setDimensions: Function}}
 */
module.exports = {
    /**
     * Set the position of the visual highlighter.
     * @param {string} elementId - The id of the DOM element that need to be highlighted
     * @returns {exports}
     */
    setDimensions: function (elementId) {
        var highlighter;
        var targetDomElement;
        var targetRect;

        if (_highLighter === null) {
            _createHighLighter();
        } else {
            _showHighLighter();
        }

        highlighter = _highLighter.firstElementChild;
        targetDomElement = document.getElementById(elementId);

        if (targetDomElement) {
            targetRect = targetDomElement.getBoundingClientRect();

            highlighter.style.top = targetRect.top + 'px';
            highlighter.style.left = targetRect.left + 'px';
            highlighter.style.height = targetRect.height + 'px';
            highlighter.style.width = targetRect.width + 'px';
        }

        return this;
    }
};
