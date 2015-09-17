'use strict';

window.chrome = require('chrome-stub');
var ContextMenu = require('../../../app/scripts/modules/background/ContextMenu.js');

describe('ContextMenu', function () {

    it('should exists', function () {
        ContextMenu.should.be.a('function');
    });

    describe('Constructor', function () {
        var contextMenu;

        beforeEach(function () {
            contextMenu = new ContextMenu({
                title: 'some title',
                id: 'some ID',
                contexts: 'all'
            });
        });

        afterEach(function () {
            contextMenu = null;
        });

        it('should set all given options', function () {
            contextMenu._title.should.equal('some title');
            contextMenu._id.should.equal('some ID');
            contextMenu._contexts.should.equal('all');
        });

        it('should create #onClicked()', function () {
            contextMenu.onClicked.should.be.a('function');
        });
    });

    describe('#create()', function () {
        it('should call "chrome.contextMenus.create" only once', function () {
            // System under Test
            var contextMenu = new ContextMenu({
                title: 'some title',
                id: 'some ID',
                contexts: 'all'
            });

            // Act
            contextMenu.create();

            // Assertion
            chrome.contextMenus.create.callCount.should.be.equals(1);
        });

        it('should call "chrome.contextMenus.create" with the same parameter as the constructor was called', function () {
            // System under Test
            var contextMenu = new ContextMenu({
                title: 'some title',
                id: 'some ID',
                contexts: 'all'
            });

            // Act
            contextMenu.create();

            // Assertion
            chrome.contextMenus.create.calledWith({
                title: 'some title',
                id: 'some ID',
                contexts: 'all'
            });
        });
    });

    describe('#removeAll()', function () {
        var contextMenu;

        beforeEach(function () {
            contextMenu = new ContextMenu({
                title: 'some title',
                id: 'some ID',
                contexts: 'all'
            });
        });

        afterEach(function () {
            contextMenu = null;
        });

        it('should remove all given options from chrome.contextMenu', function () {
            contextMenu.removeAll();
            chrome.contextMenus.removeAll.callCount.should.be.equals(1);
        });
    });

    describe('#setRightClickTarget()', function () {
        var contextMenu;

        beforeEach(function () {
            contextMenu = new ContextMenu({
                title: 'some title',
                id: 'some ID',
                contexts: 'all'
            });
        });

        afterEach(function () {
            contextMenu = null;
        });

        it('should set the given target as property', function () {
            contextMenu.setRightClickTarget('target');
            contextMenu._rightClickTarget.should.equal('target');
        });
    });

    describe('#_onClickHandler()', function () {
        var contextMenu;
        var contextMenuOnClicked;

        beforeEach(function () {
            contextMenu = new ContextMenu({
                title: 'some title',
                id: '1',
                contexts: 'all'
            });

            contextMenuOnClicked = sinon.spy(contextMenu, 'onClicked');
        });

        afterEach(function () {
            contextMenu.onClicked.restore();
            contextMenu = null;
        });

        it('should call #onClicked with given properties', function () {
            contextMenu._onClickHandler({menuItemId:'1'},{});

            contextMenu.onClicked.callCount.should.be.equals(1);
        });

        it('should not call #onClicked when given ID is different from the one used for instantiation', function () {
            contextMenu._onClickHandler({menuItemId:'2'},{});

            contextMenu.onClicked.callCount.should.be.equals(0);
        });
    });

});
