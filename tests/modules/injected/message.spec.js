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
        it('should parse input but not alter it', function () {
            var customEvent = sinon.spy();
            var myObject = {
                /**
                 * Dummy function.
                 */
                function: function () {
                    console.log('remove me');
                },
                array: [],
                undefined: undefined
            };
            document.addEventListener('ui5-communication-with-content-script', customEvent);

            message.send(myObject);

            customEvent.args[0][0].detail.should.not.have.property('function');
            customEvent.args[0][0].detail.should.not.have.property('undefined');
            myObject.should.have.property('function');
            myObject.should.have.property('undefined');
            myObject.should.not.be.equal(customEvent.args[0][0].detail);
        });
        it('should send a valid json message equivalent to JSON.parse(JSON.stringify(myObject))', function () {
            var customEvent = sinon.spy();
            var myObject = {
                number: 5,
                boolean: true,
                string: 'Hello World',
                object: {
                    another: 'object',
                    emptyArray: []
                },
                array: [
                    {
                        hello: 'world'
                    },
                    5,
                    false,
                    'Hello World',
                    [
                        null,
                        1
                    ]
                ],
                null: null,
                undefined: undefined,
                /**
                 * Dummy function.
                 */
                function: function () {
                    console.log('remove me');
                }
            };
            document.addEventListener('ui5-communication-with-content-script', customEvent);

            message.send(myObject);

            customEvent.args[0][0].detail.should.be.deep.equal(JSON.parse(JSON.stringify(myObject)));
        });
        it('should handle circular dependencies in input object', function () {
            var customEvent = sinon.spy();
            var myObject = {
                object: {
                    /**
                     * Dummy function.
                     */
                    function: function () {
                        console.log('remove me');
                    },
                    another: 'object',
                    array: [
                        5,
                        'this becomes a circular dependency'
                    ]
                },
                array: [
                    {
                        reference:  'this becomes a circular dependency'
                    }
                ],
                anotherRef: 'this becomes a circular dependency'
            };
            myObject.object.array[1] = myObject.object;
            myObject.array[0].reference = myObject.array;
            myObject.anotherRef = myObject;

            document.addEventListener('ui5-communication-with-content-script', customEvent);
            message.send(myObject);

            customEvent.args[0][0].detail.object.array[1].should.be.equal('<CIRCULAR REFERENCE>');
            customEvent.args[0][0].detail.array[0].reference.should.be.equal('<CIRCULAR REFERENCE>');
            customEvent.args[0][0].detail.anotherRef.should.be.equal('<CIRCULAR REFERENCE>');
            customEvent.args[0][0].detail.object.should.not.have.property('function');
        });
    });
});
