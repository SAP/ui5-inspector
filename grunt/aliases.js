'use strict';

/**
 * Grunt aliases
 * @type {Object}
 */
module.exports = {

    // Make sure code styles are up to par and there are no obvious mistakes.
    lint: [
        'jshint',
        'eslint'
    ],

    // Preprocess .js and .less files.
    preprocess: [
        'browserify',
        'less'
    ],

    // Builds the project without running any test.
    dist: [
        'clean',
        'preprocess',
        'copy',
        'replace',
        'usebanner',
        'compress'
    ],

    // Runs all tests for continues integration.
    test: [
        'lint',
        'less',
        'karma:CI'
    ],

    // Builds the project and monitor changes in files
    default: [
        'dist',
        'watch'
    ]
};

