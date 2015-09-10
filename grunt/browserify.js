'use strict';

/**
 * Bundl the needed modules.
 * @param {Object} grunt
 * @param {Object} config
 */
module.exports = function (grunt, config) {
    return {
        options: {
            debug: true
        },
        dev: {
            files: [{
                expand: true,
                cwd: '<%= app %>/scripts',
                src: ['**/*.js', '!modules/**/*.js'],
                dest: '<%= dist %>/scripts'
            }]
        }
    };
};
