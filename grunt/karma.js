'use strict';

/**
 * Unit test runner.
 * @param {Object} grunt
 * @param {Object} config
 */
module.exports = function (grunt, config) {
    return {
        options: {
            configFile: 'karma.conf.js',
            client: {
                mocha: {
                    reporter: 'html',
                    ui: 'bdd'
                }
            }
        },
        dev: {},
        CI: {
            singleRun: true
        }
    };
};
