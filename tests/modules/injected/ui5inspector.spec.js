'use strict';

var ui5inspector = require('../../../app/scripts/modules/injected/ui5inspector.js');

/**
 * Mock function of an eventListener callback.
 * @returns {string}
 */
var callBackMock = function mockFunctionName() {
    return 'mock';
};

/**
 * Mock function of an eventListener callback.
 * @returns {string}
 */
var callBackSecondMock = function secondMockFunctionName() {
    return 'mock';
};

describe('ui5inspector', function () {
    it('should return a object', function () {
        ui5inspector.should.be.a('object');
    });

    describe('#createReferences()', function () {
        beforeEach(function () {
            ui5inspector.createReferences();
        });

        afterEach(function () {
            window.ui5inspector = undefined;
        });

        it('should be a function', function () {
            ui5inspector.createReferences.should.be.a('function');
        });

        it('should create ui5inspector global object', function () {
            window.ui5inspector.should.be.a('object');
        });

        it('should not overwrite window.ui5inspector if it is already set', function () {
            window.ui5inspector.mock = 'mock';
            ui5inspector.createReferences();

            window.ui5inspector.mock.should.equal('mock');
        });
    });

    describe('#registerEventListener()', function () {

        beforeEach(function () {
            ui5inspector.createReferences();
        });

        afterEach(function () {
            window.ui5inspector = undefined;
        });

        it('should be a function', function () {
            ui5inspector.registerEventListener.should.be.a('function');
        });

        it('should create a references for every event that is registered', function () {
            ui5inspector.registerEventListener('mock', callBackMock);

            window.ui5inspector.events.mock.callback.should.equal('mockFunctionName');
            window.ui5inspector.events.mock.state.should.equal('registered');
        });

        it('should not register two events with the same name', function () {
            ui5inspector.registerEventListener('mock', callBackMock);
            ui5inspector.registerEventListener('mock', callBackSecondMock);

            window.ui5inspector.events.mock.callback.should.not.equal('secondMockFunctionName');
        });
    });
});
