'use strict';

/**
 * TabBar.
 * @param {string} containerId
 * @constructor
 */
function TabBar(containerId) {
    this._container = document.getElementById(containerId);
    this._contentsContainer = this._container.querySelector('contents');
    this._tabsContainer = this._container.querySelector('tabs');
    this.init();
}

/**
 * Initialize TabBar.
 */
TabBar.prototype.init = function () {
    this.setActiveTab(this.getActiveTab());

    // Add event handler on the tab container
    this._tabsContainer.onclick = this._onTabsClick.bind(this);
};

/**
 * Get current active tab ID.
 * @returns {string}
 */
TabBar.prototype.getActiveTab = function () {
    return this._activeTabId ? this._activeTabId : this._tabsContainer.querySelector('[selected]').id;
};

/**
 * Set active tab ID.
 * @param {string} newActiveTabId
 * @returns {TabBar}
 */
TabBar.prototype.setActiveTab = function (newActiveTabId) {
    if (!newActiveTabId) {
        return;
    }

    if (typeof newActiveTabId !== 'string') {
        console.warn('parameter error: The parameter must be a string');
        return;
    }

    if (!this._tabsContainer.querySelector('#' + newActiveTabId)) {
        console.warn('parameter error: The parameter must be a valid ID of a child tab element');
        return;
    }

    // Check for double clicking on active tab
    if (newActiveTabId === this.getActiveTab()) {
        var activeContent = this._contentsContainer.querySelector('[for="' + this.getActiveTab() + '"]');

        if (activeContent.getAttribute('selected')) {
            return;
        }
    }

    this._changeActiveTab(newActiveTabId);
    this._activeTabId = newActiveTabId;

    return this;
};

/**
 * Event handler for mouse click on a tabs.
 * @param {Object} event - click event
 * @private
 */
TabBar.prototype._onTabsClick = function (event) {
    var targetID = event.target.id;
    this.setActiveTab(targetID);
};

/**
 * Change visible tab and content.
 * @param {string} tabId - The Id of the desired tab
 */
TabBar.prototype._changeActiveTab = function (tabId) {
    var currentActiveTab = this._tabsContainer.querySelector('[selected]');
    var currentActiveContent = this._contentsContainer.querySelector('[for="' + this.getActiveTab() + '"]');
    var newActiveTab = this._tabsContainer.querySelector('#' + tabId);
    var newActiveContent = this._contentsContainer.querySelector('[for="' + tabId + '"]');

    currentActiveTab.removeAttribute('selected');
    currentActiveContent.removeAttribute('selected');

    newActiveTab.setAttribute('selected', 'true');
    newActiveContent.setAttribute('selected', 'true');
};

module.exports = TabBar;
