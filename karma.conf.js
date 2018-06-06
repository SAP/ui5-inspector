// Karma configuration

module.exports = function (config) {
    var configuration = {

        // Base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: './',

        // Frameworks to use
        frameworks: [
            'browserify',
            'mocha',
            'chai',
            'sinon'
        ],

        plugins: [
            'browserify',
            'browserify-istanbul',
            'karma-browserify',
            'karma-coverage',
            'karma-mocha',
            'karma-chai',
            'karma-sinon',
            'karma-chrome-launcher'
        ],

        browserify: {
            watch: true,
            debug: true,
            transform: ['browserify-istanbul']
        },

        coverageReporter: {
            // Specify a common output directory
            dir: 'tests/reports/coverage',
            reporters: [
                {type: 'lcov', subdir: 'report-lcov'}
            ],
            check: {
                each: {
                    statements: 90,
                    branches: 90,
                    functions: 90,
                    lines: 90
                }
            }
        },

        // Add preprocessor to the files that should be processed
        preprocessors: {
            'tests/**/*spec.js': ['browserify']
        },

        // List of files / patterns to load in the browser
        files: [
            {pattern: 'karma.bootstrap.js', watched: true, included: true, served: true},
            {pattern: 'tests/styles/themes/light/light.css', watched: true, included: true, served: true},
            {pattern: 'tests/styles/themes/dark/dark.css', watched: true, included: true, served: true},
            {pattern: 'tests/**/*spec.js', watched: true, included: true, served: true}
        ],

        client: {
            mocha: {
                reporter: 'html', // Change Karma's debug.html to the mocha web reporter
                ui: 'bdd'
            }
        },

        // List of files to exclude
        exclude: [],

        // Test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress', 'coverage'],

        // Web server port
        port: 9876,

        // Enable / disable colors in the output (reporters and logs)
        colors: true,

        // Level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_DEBUG,

        // Enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // Start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Chrome'],

        customLaunchers: {
            Chrome_travis_ci: {
                base: 'Chrome',
                flags: ['--no-sandbox']
            }
        },

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false
    };

    if (process.env.TRAVIS) {
        configuration.browsers = ['Chrome_travis_ci'];
    }

    config.set(configuration);
};
