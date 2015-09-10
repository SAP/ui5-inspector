'use strict';

/**
 * Grunt aliases
 * @type {Object}
 */
module.exports = {
    preprocess: [
        'jshint',
        'jscs',
        'browserify',
        'less'
    ],
    tests: [
        'jshint',
        'jscs',
        'less',
        'karma:CI'
    ],
    dist: [
        'clean:dist',
        'preprocess',
        'copy',
        'replace'
    ],
    default: [
        'dist',
        'watch'
    ],
    build: [
        'dist',
        'usebanner',
        'compress'
    ]
};

