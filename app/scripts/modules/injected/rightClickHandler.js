'use strict';

var _clickedElementId = null;

/**
 * Mouse handler for right click.
 */
module.exports = {

    /**
     * Return the ID of the ui5 control that was clicked.
     * @returns {string}
     */
    getClickedElementId: function () {
        return _clickedElementId;
    },

    /**
     * Set the ID of the ui5 control that was clicked.
     * @param {Element} target
     * @returns {exports}
     */
    setClickedElementId: function (target) {
        while (!target.getAttribute('data-sap-ui')) {
            if (target.nodeName === 'BODY') {
                break;
            }
            target = target.parentNode;
        }

        _clickedElementId = target.id;
        return this;
    }
};
