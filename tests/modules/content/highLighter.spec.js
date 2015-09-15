'use strict';

// TODO the highLighter module needs refactoring
var highLighter = require('../../../app/scripts/modules/content/highLighter.js');

describe('highLighter', function () {
    it('should return a object', function () {
        highLighter.should.be.a('object');
    });

    describe('#setDimensions()', function () {
        var fixtures = document.getElementById('fixtures');

        before(function () {
            fixtures.innerHTML = '<div id="shell" style="width: 50px; height: 50px;"></div>';
        });

        after(function () {
            fixtures.innerHTML = '';
            document.getElementById('ui5-highlighter').parentNode.removeChild(document.getElementById('ui5-highlighter'));
        });

        it('should create a DOM elements', function () {
            highLighter.setDimensions('shell');

            document.body.querySelector('#ui5-highlighter').should.exist;
            document.body.querySelector('#ui5-highlighter > div').should.exist;
        });

        it('should set proper sizes to the "#ui5-highlighter > div" element', function () {
            highLighter.setDimensions('shell');

            document.body.querySelector('#ui5-highlighter > div').style.width.should.equal('50px');
            document.body.querySelector('#ui5-highlighter > div').style.height.should.equal('50px');
        });

        it('should position the inner div according to target', function () {
            var mock = document.getElementById('shell').getBoundingClientRect();
            highLighter.setDimensions('shell');

            document.body.querySelector('#ui5-highlighter > div').style.top.should.equal(mock.top + 'px');
            document.body.querySelector('#ui5-highlighter > div').style.left.should.equal(mock.left + 'px');
        });

        it('should not add CSS styles if the target can not be found', function () {
            document.body.querySelector('#ui5-highlighter > div').removeAttribute('style');
            highLighter.setDimensions('shell-mock');

            document.body.querySelector('#ui5-highlighter > div').style.width.should.equal('');
            document.body.querySelector('#ui5-highlighter > div').style.height.should.equal('');
            document.body.querySelector('#ui5-highlighter > div').style.top.should.equal('');
            document.body.querySelector('#ui5-highlighter > div').style.left.should.equal('');
        });

        it('should hide the highlighter on hover', function () {
            highLighter.setDimensions('shell');
            document.body.querySelector('#ui5-highlighter').onmouseover();

            document.body.querySelector('#ui5-highlighter').style.display.should.equal('none');
        });

        it('should create only one highlighter', function () {
            highLighter.setDimensions('shell');
            highLighter.setDimensions('shell');

            document.body.querySelectorAll('#ui5-highlighter').length.should.equal(1);
        });

    });
});
