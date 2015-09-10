'use strict';

/**
 * Replace text in files.
 * @param {Object} grunt
 * @param {Object} config
 */
module.exports = function (grunt, config) {
    return {
        toolsAPI: {
            src: [
                '<%= app %>/vendor/ToolsAPI.js'
            ],
            dest: '<%= dist %>/vendor/ToolsAPI.js',
            replacements: [{
                from: 'sap.ui.define([',
                to: 'sap.ui.define(\'ToolsAPI\', ['
            }]
        }
    };
};
