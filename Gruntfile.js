/*!
 * SAP
 * (c) Copyright 2015 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

'use strict';

/**
 * Grunt configuration file.
 * @param {Object} grunt
 */
module.exports = function (grunt) {

    require('time-grunt')(grunt);

    require('load-grunt-config')(grunt, {
        // Data passed into config.  Can use with <%= *** %>
        data: {
            app: 'app',
            dist: 'dist',
            tests: 'tests',
            bower: 'bower_components',
            grunt: 'grunt'
        }
    });

};
