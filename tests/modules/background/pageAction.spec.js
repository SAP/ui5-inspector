'use strict';

var pageAction = require('../../../app/scripts/modules/background/pageAction.js');

window.chrome = require('chrome-stub');
window.chrome.action = {
    /**
     * Mock function of chrome api.
     */
    setTitle: function () {
    },
    disable: function () {
    },
    enable: function () {
    }
};

describe('pageAction', function () {
    it('should return a object', function () {
        pageAction.should.be.a('object');
    });

    describe('#create()', function () {
        var pageActionSetTitle;

        beforeEach(function () {
            pageActionSetTitle = sinon.spy(window.chrome.action, 'setTitle');
        });

        afterEach(function () {
            pageActionSetTitle.restore();
        });

        it('should call chrome.action.setTitle', function () {
            pageAction.create({
                framework: 'mock-framework',
                version: 'mock-version',
                tabId: 'mock-tabId'
            });

            pageActionSetTitle.callCount.should.equal(1);
        });
    });

    describe('#disable() & #enable()', function () {
        var disableStub;
        var enableStub;

        beforeEach(function () {
            disableStub = sinon.spy(window.chrome.action, 'disable');
            enableStub = sinon.spy(window.chrome.action, 'enable');
        });

        afterEach(function () {
            disableStub.restore();
            enableStub.restore();
        });

        it('should call chrome.action.disable', function () {
            pageAction.disable();

            disableStub.callCount.should.equal(1);
        });

        it('should call chrome.action.enable', function () {
            pageAction.enable();

            enableStub.callCount.should.equal(1);
        });
    });
});
