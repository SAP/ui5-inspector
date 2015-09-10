'use strict';

/**
 * Compress dist files to zip package.
 * @param {Object} grunt
 * @param {Object} config
 */
module.exports = function (grunt, config) {
    return {
        dist: {
            options: {
                /**
                 * Describe archive location.
                 * @returns {string}
                 */
                archive: function () {
                    // If we need to add the version to the zip name
                    // var manifest = grunt.file.readJSON('app/manifest.json');
                    return 'package/ui5inspector.zip';
                }
            },
            files: [{
                expand: true,
                cwd: 'dist/',
                src: ['**'],
                dest: ''
            }]
        }
    };
};
