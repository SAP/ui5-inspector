'use strict';

var messenger = require('../../../app/scripts/modules/background/messenger.js');
window.chrome = require('chrome-stub');

var portMock = {
    name: 'mock',
    /**
     * Mock function.
     */
    postMessage: function () {
    }
};

var secondPortMock = {
    name: 'secondMock',
    /**
     * Mock function.
     */
    postMessage: function () {
    }
};

describe('messenger.js', function () {
    it('should return a object', function () {
        messenger.should.be.a('object');
    });

    describe('#addPort()', function () {
        beforeEach(function () {
            messenger.addPort(portMock, 1);
        });

        afterEach(function () {
            messenger.ports = {};
        });

        it('should add chrome port to "ports" object', function () {
            messenger.ports[1].should.exist;
        });

        it('should add chrome port to "ports" object', function () {
            messenger.ports[1].someNewProperty = 'mock';
            messenger.addPort(portMock, 1);

            messenger.ports[1].someNewProperty.should.exist;
        });
    });

    describe('#deletePort()', function () {

        beforeEach(function () {
            messenger.addPort(portMock, 1);
        });

        afterEach(function () {
            messenger.ports = {};
        });

        it('should remove chrome port from "ports" object', function () {
            messenger.deletePort(portMock, 1);

            should.equal(messenger.ports[1], undefined);
        });

        it('should not delete other ports from the same tab', function () {
            messenger.addPort(secondPortMock, 1);
            messenger.deletePort(portMock, 1);

            messenger.ports[1].secondMock.should.exist;
        });

        it('should not do anything if the ID is undefined', function () {
            messenger.deletePort(portMock, undefined);

            messenger.ports[1].mock.should.exist;
        });
    });

    describe('#sendToAll()', function () {
        var postMessageFromFirstMock;
        var postMessageFromSecondtMock;

        beforeEach(function () {
            messenger.addPort(portMock, 1);
            messenger.addPort(secondPortMock, 1);
            messenger.addPort(portMock, 2);
            messenger.addPort(secondPortMock, 2);

            postMessageFromFirstMock = sinon.spy(portMock, 'postMessage');
            postMessageFromSecondtMock = sinon.spy(secondPortMock, 'postMessage');
        });

        afterEach(function () {
            portMock.postMessage.restore();
            secondPortMock.postMessage.restore();
            messenger.ports = {};
        });

        it('should send message to all ports from same tab', function () {
            messenger.sendToAll('message', 2);

            postMessageFromFirstMock.callCount.should.equal(1);
            postMessageFromFirstMock.calledWith('message');

            postMessageFromSecondtMock.callCount.should.equal(1);
            postMessageFromSecondtMock.calledWith('message');
        });

        it('should not do anything if the ID is undefined', function () {
            messenger.sendToAll('message', undefined);

            postMessageFromFirstMock.callCount.should.equal(0);
            postMessageFromSecondtMock.callCount.should.equal(0);
        });
    });
});
