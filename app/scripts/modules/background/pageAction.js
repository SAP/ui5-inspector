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

        chrome.action.setTitle({
            tabId: tabId,
            title: 'This page is using ' + framework + ' v' + version
        });
    },

    /**
     * Disable page action.
     *
     */
    disable: function () {
        chrome.action.disable();
    },

    /**
     * Enable page action.
     *
     */
    enable: function () {
        chrome.action.enable();
    }
};

module.exports = pageAction;
