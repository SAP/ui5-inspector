'use strict';

/**
 * Copies remaining files.
 * @param {Object} grunt
 * @param {Object} config
 */
module.exports = function (grunt, config) {
    return {
        dist: {
            files: [{
                expand: true,
                dot: true,
                cwd: '<%= app %>',
                dest: '<%= dist %>',
                src: [
                    '*.txt',
                    'html/**/*.html',
                    'images/**/*.*',
                    'vendor/*.js',
                    'manifest.json'
                ]
            }]
        },

        license: {
            files: [{
                expand: true,
                dot: true,
                cwd: './',
                dest: '<%= dist %>',
                src: [
                    '*.txt'
                ]
            }]
        }
    };
};
