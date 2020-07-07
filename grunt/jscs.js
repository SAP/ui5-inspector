'use strict';

/**
 * Make sure code styles are up to par and there are no obvious mistakes.
 * @param {Object} grunt
 * @param {Object} config
 */
module.exports = function (grunt, config) {
    return {
        options: {
            config: '.jscsrc',
            verbose: true, // Output with rule names
            requireCurlyBraces: ['if']
        },
        scripts: {
            files: {
                src: ['<%= app %>/scripts/**/*.js']
            }
        },
        karma: {
            files: {
                src: ['<%= tests %>/**/*.js', '!<%= tests %>/reports/**/*.*']
            }
        },
        gruntfiles: {
            files: {
                src: ['Gruntfile.js', '<%= grunt %>/*.js']
            }
        }
    };
};
