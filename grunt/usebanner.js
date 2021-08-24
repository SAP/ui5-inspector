'use strict';

/**
 * Add copy right comments inside the distributed files.
 * @param {Object} grunt
 * @param {Object} config
 */
module.exports = function (grunt, config) {
    return {
        HTML: {
            options: {
                position: 'top',
                banner: '<!--\n' +
                '- SAP\n' +
                '- (c) Copyright 2015 SAP SE or an SAP affiliate company.\n' +
                '- Licensed under the Apache License, Version 2.0 - see LICENSE.txt.\n' +
                '-->',
                linebreak: true
            },
            files: {
                src: ['<%= dist %>/**/*.html']
            }
        }
    };
};
