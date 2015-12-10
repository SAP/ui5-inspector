'use strict';

module.exports = {

    // Reference for the ID of the last click UI5 control.
    _clickedElementId: null,

    /**
     * Return the ID of the UI5 control that was clicked.
     * @returns {string}
     */
    getClickedElementId: function () {
        return this._clickedElementId;
    },

    /**
     * Set the ID of the UI5 control that was clicked.
     * @param {Element} target
     * @returns {string}
     */
    setClickedElementId: function (target) {
        while (target && !target.getAttribute('data-sap-ui')) {
            if (target.nodeName === 'BODY') {
                break;
            }
            target = target.parentNode;
        }

        this._clickedElementId = target.id;
        return this;
    }
};
