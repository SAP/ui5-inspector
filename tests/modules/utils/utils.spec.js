'use strict';

var utils = require('../../../app/scripts/modules/utils/utils.js');

var messageAction = {
    /**
     * Mock function for the unit test purpose.
     * @param {Object} message
     */
    'mock-action': function (message) {
        return console.log('Message resolver is working');
    }
};

describe('utils', function () {
    it('should exists', function () {
        utils.should.be.a('object');
    });

    describe('#formatter', function () {
        it('should be an object', function () {
            utils.formatter.should.be.a('object');
        });
    });

    describe('#formatter.convertUI5TimeStampToHumanReadableFormat()', function () {
        it('should re-format UI5 timestamp to human readable format', function () {
            utils.formatter.convertUI5TimeStampToHumanReadableFormat('20150817-1459').should.be.equal('2015/08/17 14:59h');
        });
    });

    describe('#resolveMessage()', function () {
        var spyConsole;

        beforeEach(function () {
            spyConsole = sinon.spy(console, 'log');
        });

        afterEach(function () {
            console.log.restore();
        });

        it('should resolve the action that is needed from a message', function () {
            utils.resolveMessage({
                message: {
                    action: 'mock-action'
                },
                messageSender: 'messageSender',
                sendResponse: 'sendResponse',
                actions: messageAction
            });

            spyConsole.callCount.should.equal(1);
        });

        it('should do nothing if no parameters are provided', function () {
            utils.resolveMessage();

            spyConsole.callCount.should.equal(0);
        });

        it('should do nothing if the parameter contains unknown action', function () {
            utils.resolveMessage({
                message: {
                    action: 'other-mock-action'
                },
                messageSender: 'messageSender',
                sendResponse: 'sendResponse',
                actions: messageAction
            });

            spyConsole.callCount.should.equal(0);
        });

    });

    describe('#setOSClassName()', function () {
        var navigatorAppVersionInitialValue = navigator.appVersion;

        beforeEach(function () {
        });

        afterEach(function () {
            navigator.__defineGetter__('appVersion', function () {
                return navigatorAppVersionInitialValue;
            });
        });

        it('should add attribute os="windows" on Windows', function () {
            navigator.__defineGetter__('appVersion', function () {
                return 'Win';
            });

            utils.setOSClassName();

            document.querySelector('body').getAttribute('os').should.equal('windows');
        });

        it('should add attribute os="mac" on OSx', function () {
            navigator.__defineGetter__('appVersion', function () {
                return 'Mac';
            });

            utils.setOSClassName();

            document.querySelector('body').getAttribute('os').should.equal('mac');
        });

        it('should add attribute os="linux" on Linux', function () {
            navigator.__defineGetter__('appVersion', function () {
                return 'Linux';
            });

            utils.setOSClassName();

            document.querySelector('body').getAttribute('os').should.equal('linux');
        });
    });

    describe('#applyTheme()', function () {

        it('should change theme', function () {

            utils.applyTheme('dark');

            expect(document.getElementById('ui5inspector-theme').href).to.have.string('/styles/themes/dark/dark.css');

            utils.applyTheme('light');

            expect(document.getElementById('ui5inspector-theme').href).to.have.string('/styles/themes/light/light.css');
        });
    });
});
