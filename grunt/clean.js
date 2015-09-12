'use strict';

/**
 * Empties folders to start fresh.
 * @param {Object} grunt
 * @param {Object} config
 */
module.exports = function (grunt, config) {
    return {
        all: {
            files: [{
                dot: true,
                src: [
                    '<%= dist %>/*'
                ]
            }]
        }
    };
};
