'use strict';

var pageAction = require('../../../app/scripts/modules/background/pageAction.js');

window.chrome = require('chrome-stub');
window.chrome.pageAction = {
    /**
     * Mock function of chrome api.
     */
    show: function () {
    },
    /**
     * Mock function of chrome api.
     */
    setTitle: function () {
    }
};

describe('pageAction', function () {
    it('should return a object', function () {
        pageAction.should.be.a('object');
    });

    describe('#create()', function () {
        var pageActionShow;
        var pageActionSetTitle;

        beforeEach(function () {
            pageActionShow = sinon.spy(window.chrome.action, 'show');
            pageActionSetTitle = sinon.spy(window.chrome.action, 'setTitle');
        });

        afterEach(function () {
            window.chrome.action.show.restore();
            window.chrome.action.setTitle.restore();
        });

        it('should call chrome.pageAction.show', function () {
            var mock = {
                framework: 'mock-framework',
                version: 'mock-version',
                tabId: 'mock-tabId'
            };
            pageAction.create(mock);

            pageActionShow.callCount.should.equal(1);
            pageActionShow.calledWith(mock.tabId).should.equal(true);
        });

        it('should call chrome.pageAction.setTitle', function () {
            pageAction.create({
                framework: 'mock-framework',
                version: 'mock-version',
                tabId: 'mock-tabId'
            });

            pageActionShow.callCount.should.equal(1);
        });
    });
});
