'use strict';

var message = require('../../../app/scripts/modules/injected/message.js');
var mock = {
    mock: 'mock'
};

describe('message.js', function () {
    it('should return a object', function () {
        message.should.be.a('object');
    });

    it('should has send method', function () {
        message.send.should.be.a('function');
    });

    describe('#send()', function () {
        it('should fire custom event', function () {
            var customEvent = sinon.spy();
            document.addEventListener('ui5-communication-with-content-script', customEvent);

            message.send(mock);

            customEvent.callCount.should.be.equal(1);
            customEvent.args[0][0].detail.mock.should.be.equal('mock');
        });
    });
});
