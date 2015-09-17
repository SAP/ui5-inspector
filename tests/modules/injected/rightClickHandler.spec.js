'use strict';

var rightClickHandler = require('../../../app/scripts/modules/injected/rightClickHandler.js');

describe('rightClickHandler', function () {
    it('should return a object', function () {
        rightClickHandler.should.be.a('object');
    });

    describe('#setClickedElementId()', function () {
        var fixtures = document.getElementById('fixtures');

        beforeEach(function () {
            fixtures.innerHTML = '<div><div><div id="shell" data-sap-ui="shell"><span>mock</span></div></div></div>';
        });

        afterEach(function () {
            fixtures.innerHTML = '';
        });

        it('should be a function', function () {
            rightClickHandler.setClickedElementId.should.be.a('function');
        });

        it('should set the ID of the UI5 control', function () {
            var element = fixtures.querySelector('#shell');
            rightClickHandler.setClickedElementId(element);

            rightClickHandler._clickedElementId.should.equal('shell');
        });

        it('should set the ID of the first UI5 parent control of the given target', function () {
            var element = fixtures.querySelector('#shell span');
            rightClickHandler.setClickedElementId(element);

            rightClickHandler._clickedElementId.should.equal('shell');
        });

        it('should set empty string if there are no UI5 controls', function () {
            rightClickHandler.setClickedElementId(fixtures.firstElementChild);

            rightClickHandler._clickedElementId.should.equal('');
        });
    });

    describe('#getClickedElementId()', function () {
        it('should be a function', function () {
            rightClickHandler.getClickedElementId.should.be.a('function');
        });

        it('should return the last clicked element ID', function () {
            rightClickHandler._clickedElementId = 'mock';
            rightClickHandler.getClickedElementId().should.equal('mock');
        });
    });
});
