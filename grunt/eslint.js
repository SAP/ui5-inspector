'use strict';

/**
 * Make sure code styles are up to par and there are no obvious mistakes.
 * @param {Object} grunt
 * @param {Object} config
 */
module.exports = function (grunt, config) {
    return {
        options: {
            configFile: '.eslintrc',
        },
        target: ['<%= app %>/scripts/**/*.js'],
    };
};
