'use strict';

var utils = require('../utils/utils.js');

/**
 * Get common application information.
 * @returns {Object} commonInformation - ToolsAPI.commonInformation
 * @private
 */
function _getCommonInformation(commonInformation) {
    var frameworkName = commonInformation.frameworkName;
    var buildTime = utils.formatter.convertUI5TimeStampToHumanReadableFormat(commonInformation.buildTime);
    var lastChange = utils.formatter.convertUI5TimeStampToHumanReadableFormat(commonInformation.lastChange);
    var result = {};

    if (lastChange) {
        result[frameworkName] = commonInformation.version + ' (built at ' + buildTime + ' last change ' + lastChange + ')';
    } else {
        result[frameworkName] = commonInformation.version + ' (built at ' + buildTime + ')';
    }

    result['User Agent'] = commonInformation.userAgent;
    result.Application = commonInformation.applicationHREF;

    return result;
}

/**
 * Get bootstrap configuration information.
 * @returns {Object} configurationBootstrap - ToolsAPI.configurationBootstrap
 * @private
 */
function _getConfigurationBootstrap(configurationBootstrap) {
    var bootConfigurationResult = {};

    for (var key in configurationBootstrap) {
        if (configurationBootstrap[key] instanceof Object === true) {
            bootConfigurationResult[key] = JSON.stringify(configurationBootstrap[key]);
        } else {
            bootConfigurationResult[key] = configurationBootstrap[key];
        }
    }

    return bootConfigurationResult;
}

/**
 * Get loaded modules application information.
 * @returns {Object} loadedModules - ToolsAPI.loadedModules
 * @private
 */
function _getLoadedModules(loadedModules) {
    var loadedModulesResult = {};

    for (var i = 0; i < loadedModules.length; i++) {
        loadedModulesResult[i + 1] = loadedModules[i];
    }

    return loadedModulesResult;
}

/**
 * Get application URL parameters.
 * @returns {Object} URLParameters - ToolsAPI.URLParameters
 * @private
 */
function _getURLParameters(URLParameters) {
    var urlParametersResult = {};

    for (var key in URLParameters) {
        urlParametersResult[key] = URLParameters[key].join(', ');
    }

    return urlParametersResult;
}

// Public API
module.exports = {

    /**
     * Get UI5 information for the current inspected page.
     * @param {Object} ToolsAPI
     * @returns {Object}
     */
    getApplicationInfo: function (ToolsAPI) {
        var frameworkInformation = ToolsAPI.getFrameworkInformation();

        return {
            common: {
                options: {
                    title: 'General',
                    expandable: true,
                    expanded: true
                },
                data: _getCommonInformation(frameworkInformation.commonInformation)
            },

            configurationBootstrap: {
                options: {
                    title: 'Configuration (bootstrap)',
                    expandable: true,
                    expanded: true
                },
                data: _getConfigurationBootstrap(frameworkInformation.configurationBootstrap)
            },

            configurationComputed: {
                options: {
                    title: 'Configuration (computed)',
                    expandable: true,
                    expanded: true
                },
                data: frameworkInformation.configurationComputed
            },

            urlParameters: {
                options: {
                    title: 'URL Parameters',
                    expandable: true,
                    expanded: true
                },
                data: _getURLParameters(frameworkInformation.URLParameters)
            },

            loadedLibraries: {
                options: {
                    title: 'Libraries (loaded)',
                    expandable: true,
                    expanded: true
                },
                data: frameworkInformation.loadedLibraries
            },

            libraries: {
                options: {
                    title: 'Libraries (all)',
                    expandable: true
                },
                data: frameworkInformation.libraries
            },

            loadedModules: {
                options: {
                    title: 'Modules (loaded)',
                    expandable: true
                },
                data: _getLoadedModules(frameworkInformation.loadedModules)
            }
        };
    },

    /**
     * Get the needed information for the popup.
     * @param {Object} ToolsAPI
     * @returns {Object}
     */
    getInformationForPopUp: function (ToolsAPI) {
        var frameworkInformation = ToolsAPI.getFrameworkInformation();

        return _getCommonInformation(frameworkInformation.commonInformation);
    }
};
