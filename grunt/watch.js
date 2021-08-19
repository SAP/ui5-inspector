'use strict';

/**
 * Watches files for changes and runs tasks based on the changed files.
 * @param {Object} grunt
 * @param {Object} config
 */
module.exports = function (grunt, config) {
    return {
        options: {
            spawn: false,
            interval: 5000
        },
        html: {
            files: ['<%= app %>/**/*.html'],
            tasks: ['copy']
        },
        js: {
            files: ['<%= app %>/scripts/**/*.js'],
            tasks: ['newer:jshint:scripts', 'newer:eslint:scripts', 'browserify']
        },
        tests: {
            files: ['<%= tests %>/**/*.js'],
            tasks: ['newer:jshint:karma', 'newer:eslint:karma']
        },
        gruntfiles: {
            files: ['Gruntfile.js', '<%= grunt %>/*.js'],
            tasks: ['newer:jshint:gruntfiles', 'newer:eslint:gruntfiles']
        },
        styles: {
            files: ['<%= app %>/styles/less/**/*.less'],
            tasks: ['less']
        }
    };
};
