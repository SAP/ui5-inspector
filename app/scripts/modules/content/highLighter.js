'use strict';

/**
 * Singleton helper to highlight controls DOM elements
 */
var Highlighter = {
    // Reference for the highlighter DOM element
    _highLighterDomEl: null,

    /**
     * Hide the highlighter.
     * @public
     */
    hide: function () {
        this._highLighterDomEl && (this._highLighterDomEl.style.display = 'none');
    },

    /**
     * Show the highlighter.
     * @private
     */
    _show: function () {
        this._highLighterDomEl && (this._highLighterDomEl.style.display = 'block');
    },

    /**
     * Create DOM element for visual highlighting.
     * @private
     */
    _create: function () {
        var highLighter = document.createElement('div');
        highLighter.style.cssText = 'box-sizing: border-box;border:1px solid blue;background: rgba(20, 20, 200, 0.4);position: absolute';

        var highLighterWrapper = document.createElement('div');
        highLighterWrapper.id = 'ui5-highlighter';
        highLighterWrapper.style.cssText = 'position: fixed;top:0;right:0;bottom:0;left:0;z-index: 1000;overflow: hidden;';
        highLighterWrapper.appendChild(highLighter);

        document.body.appendChild(highLighterWrapper);

        // Save reference for later usage
        this._highLighterDomEl = document.getElementById('ui5-highlighter');

        // Add event handler
        this._highLighterDomEl.onmouseover = this.hide.bind(this);
    },

    /**
     * Set the position of the visual highlighter.
     * @param {string} elementId - The id of the DOM element that need to be highlighted
     * @returns {exports}
     */
    setDimensions: function (elementId) {
        var highlighter;
        var targetDomElement;
        var targetRect;

        // the hightlighter DOM element may already have been created in a previous DevTools session
        // (followed by closing and reopening the DevTools)
        this._highLighterDomEl || (this._highLighterDomEl = document.getElementById('ui5-highlighter'));

        if (!this._highLighterDomEl) {
            this._create();
        } else {
            this._show();
        }

        highlighter = this._highLighterDomEl.firstElementChild;
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

module.exports = Highlighter;
