'use strict';

/**
 * Upload lcov file to coveralls.
 * @param {Object} grunt
 * @param {Object} config
 */
module.exports = function (grunt, config) {
    return {
        target: {
            src: '<%= tests %>/reports/coverage/lcov.info'
        }
    };
};
