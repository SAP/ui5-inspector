'use strict';

/**
 * Context menu.
 * @param {Object} options
 * @constructor
 */
function ContextMenu(options) {
    this._title = options.title;
    this._id = options.id;
    this._contexts = options.contexts;

    /**
     * This method will be fired when an instanced is clicked. The idea is to be overwritten from the instance.
     * @param {Object} info - Information sent when a context menu item is clicked.
     * @param {Object} tab - The details of the tab where the click took place. If the click did not take place in a tab,
     * this parameter will be missing.
     */
    this.onClicked = function (info, tab) {
    };
}

/**
 * Create context menu item.
 */
ContextMenu.prototype.create = function () {
    var that = this;

    chrome.contextMenus.create({
        title: that._title,
        id: that._id,
        contexts: that._contexts
    });

    chrome.contextMenus.onClicked.addListener(function (info, tabs) {
            if (info.menuItemId === that._id) {
                that.onClicked(info, tabs);
            }
        }
    );
};

/**
 * Delete all context menu items.
 */
ContextMenu.prototype.removeAll = function () {
    chrome.contextMenus.removeAll();
};

/**
 * Set right clicked element.
 * @param {string} target
 */
ContextMenu.prototype.setRightClickTarget = function (target) {
    this._rightClickTarget = target;
};

module.exports = ContextMenu;
