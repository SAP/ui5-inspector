'use strict';

var utils = require('../utils/utils.js');

/**
 * Get common application information.
 * @returns {Object} commonInformation - commonInformation property from ToolsAPI.getFrameworkInformation()
 * @private
 */
function _getCommonInformation(commonInformation) {
    var frameworkName = commonInformation.frameworkName;
    var buildTime = utils.formatter.convertUI5TimeStampToHumanReadableFormat(commonInformation.buildTime);
    var result = {};

    result[frameworkName] = commonInformation.version + ' (built at ' + buildTime + ')';

    result['User Agent'] = commonInformation.userAgent;
    result.Application = commonInformation.applicationHREF;

    return result;
}

/**
 * Get bootstrap configuration information.
 * @returns {Object} configurationBootstrap - configurationBootstrap property from ToolsAPI.getFrameworkInformation()
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
 * @returns {Object} loadedModules - loadedModules property from ToolsAPI.getFrameworkInformation()
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
 * @returns {Object} URLParameters - URLParameters property from ToolsAPI.getFrameworkInformation()
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
     * @param {Object} frameworkInformation - frameworkInformation property from ToolsAPI.getFrameworkInformation()
     * @returns {Object}
     */
    getApplicationInfo: function (frameworkInformation) {
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
     * @param {Object} frameworkInformation - frameworkInformation property from ToolsAPI.getFrameworkInformation();
     * @returns {Object}
     */
    getInformationForPopUp: function (frameworkInformation) {
        return _getCommonInformation(frameworkInformation.commonInformation);
    }
};
