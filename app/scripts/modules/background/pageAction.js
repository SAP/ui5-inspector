'use strict';

/**
 * Page action.
 * @type {{create: Function}}
 */
var pageAction = {

    /**
     * Create page action.
     * @param {Object} options
     */
    create: function (options) {
        var framework = options.framework;
        var version = options.version;
        var tabId = options.tabId;

        chrome.pageAction.show(tabId);
        chrome.pageAction.setTitle({
            tabId: tabId,
            title: 'This page is using ' + framework + ' v' + version
        });
    }
};

module.exports = pageAction;
