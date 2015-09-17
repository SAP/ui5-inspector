'use strict';

var TabBar = require('../../../app/scripts/modules/ui/TabBar.js');

describe('TabBar', function () {
    var fixtures = document.getElementById('fixtures');
    var tabbar;

    beforeEach(function () {
        fixtures.innerHTML = '' +
            '<tabbar id="tabbar">' +
            ' <tabs>' +
            '  <tab id="first">first</tab>' +
            '  <tab id="second">second</tab>' +
            '  <tab id="third" selected>third</tab>' +
            ' </tabs>' +
            ' <contents>' +
            '  <content for="first">lorem</content>' +
            '  <content for="second">Lorem ipsum.</content>' +
            '  <content for="third">Lorem ipsum dolor.</content>' +
            ' </contents>' +
            '</tabbar>';

        tabbar = new TabBar('tabbar');
    });

    afterEach(function () {
        document.getElementById('tabbar').parentNode.removeChild(document.getElementById('tabbar'));
    });

    describe('#init()', function () {
        describe('should call "#setActiveTab()" ', function () {
            var setActiveTab;
            var eventMock;

            beforeEach(function () {
                setActiveTab = sinon.spy(tabbar, 'setActiveTab');

                tabbar.init();
            });

            afterEach(function () {
                tabbar.setActiveTab.restore();
            });

            it('only once', function () {
                setActiveTab.callCount.should.equal(1);
            });

            it('with the ID of the initial active tab', function () {
                setActiveTab.calledWith(tabbar.getActiveTab()).should.equal(true);
            });
        });
    });

    describe('#getActiveTab()', function () {
        it('should return "third"', function () {
            tabbar.getActiveTab().should.equal('third');
        });
    });

    describe('#setActiveTab()', function () {

        it('should not change the active tab if a falsy parameter is used', function () {
            tabbar.setActiveTab('');
            tabbar.getActiveTab().should.equal('third');
        });

        describe('should log warning message because', function () {
            var spyConsole;

            beforeEach(function () {
                spyConsole = sinon.spy(console, 'warn');
            });

            afterEach(function () {
                console.warn.restore();
            });

            it('an unknown ID is used', function () {
                tabbar.setActiveTab('unknownId');
                spyConsole.callCount.should.equal(1);
            });

            it('an non string parameter is used', function () {
                tabbar.setActiveTab(123);
                spyConsole.callCount.should.equal(1);
            });
        });

        it('should change active tab', function () {
            tabbar.setActiveTab('first');
            tabbar.getActiveTab().should.equal('first');
        });

    });

    describe('#_onTabsClick()', function () {
        describe('should call "#setActiveTab()" ', function () {
            var setActiveTab;
            var eventMock;

            beforeEach(function () {
                setActiveTab = sinon.spy(tabbar, 'setActiveTab');
                eventMock = {target: {id: 'first'}};

                tabbar._onTabsClick(eventMock);
            });

            afterEach(function () {
                tabbar.setActiveTab.restore();
            });

            it('only once', function () {
                setActiveTab.callCount.should.equal(1);
            });

            it('with mouse event argument', function () {
                setActiveTab.calledWith(eventMock.target.id).should.equal(true);
            });
        });
    });

    describe('#_changeActiveTab()', function () {
        var successfulClick;

        beforeEach(function () {
            successfulClick = sinon.spy(tabbar, '_changeActiveTab');
        });

        afterEach(function () {
            tabbar._changeActiveTab.restore();
        });

        it('should add "selected" attribute to the active tab', function () {
            tabbar._changeActiveTab('first');
            var selectedTab = tabbar._tabsContainer.querySelector('#first').getAttribute('selected');

            selectedTab.should.equal('true');
        });
        it('should add "selected" attribute to the active content', function () {
            tabbar._changeActiveTab('first');
            var selectedTab = tabbar._contentsContainer.querySelector('[for="first"]').getAttribute('selected');

            selectedTab.should.equal('true');
        });
        it('should set only one "selected" attribute on the active tag and active content', function () {
            tabbar._changeActiveTab('first');

            tabbar._tabsContainer.querySelectorAll('[selected]').length.should.equal(1);
            tabbar._contentsContainer.querySelectorAll('[selected]').length.should.equal(1);
        });

        describe('should be called from mouse click', function () {
            beforeEach(function () {
                tabbar._tabsContainer.querySelector('#first').click();
            });

            it('only once', function () {
                tabbar._tabsContainer.querySelector('#first').click();
                tabbar._tabsContainer.querySelector('#first').click();

                successfulClick.callCount.should.equal(1);
            });
            it('with parameter equal to "first"', function () {
                tabbar._tabsContainer.querySelector('#first').click();

                var calledWithArgument = successfulClick.getCall(0).args[0];
                calledWithArgument.should.equal('first');
            });
            it('and set "selected" attribute on the clicked tab ', function () {
                tabbar._tabsContainer.querySelector('[selected]').id.should.equal('first');
            });
        });
    });

    describe('Clicking with mouse', function () {
        var successfulClick;

        beforeEach(function () {
            successfulClick = sinon.spy(tabbar, '_changeActiveTab');

            tabbar._tabsContainer.querySelector('#first').click();
            tabbar._tabsContainer.querySelector('#second').click();
            tabbar._tabsContainer.querySelector('#third').click();
        });

        afterEach(function () {
            tabbar._changeActiveTab.restore();
        });
        describe('multiple times', function () {
            it('should set only one "selected" attribute on the active tab"', function () {
                tabbar._tabsContainer.querySelectorAll('[selected]').length.should.equal(1);
            });
            it('should set only one "selected" attribute on the active content"', function () {
                tabbar._contentsContainer.querySelectorAll('[selected]').length.should.equal(1);
            });
        });
    });
});
