'use strict';

var Splitter = require('../../../app/scripts/modules/ui/SplitContainer.js');

describe('Splitter', function () {
    var fixtures = document.getElementById('fixtures');

    beforeEach(function () {
        fixtures.innerHTML = '' +
            '<div style="display:flex; height: 200px; border: solid 1px;">' +
            '<splitter id="vertical-splitter" orientation="vertical"><start>start</start><end>end</end></splitter>' +
            '</div>' +
            '<div style="display:flex; height: 200px; border: solid 1px;">' +
            '<splitter id="horizontal-splitter" orientation="horizontal"><start>start</start><end>end</end></splitter>' +
            '</div>';
    });

    afterEach(function () {
        fixtures.innerHTML = '';
    });

    describe('constructor', function () {
        it('should create horizontal splitter with fixed width for the start container', function () {
            var splitter = new Splitter('horizontal-splitter', {
                startContainerWidth: '400px'
            });

            splitter.$this.querySelector('start').style.width.should.equal('400px');
        });

        it('should create horizontal splitter with fixed width for the end container', function () {
            var splitter = new Splitter('horizontal-splitter', {
                endContainerWidth: '400px'
            });

            splitter.$this.querySelector('end').style.width.should.equal('400px');
        });

        it('should create vertical splitter with fixed height for the start container', function () {
            var splitter = new Splitter('vertical-splitter', {
                startContainerHeight: '400px'
            });

            splitter.$this.querySelector('start').style.height.should.equal('400px');
        });

        it('should create vertical splitter with fixed height for the end container', function () {
            var splitter = new Splitter('vertical-splitter', {
                endContainerHeight: '400px'
            });

            splitter.$this.querySelector('end').style.height.should.equal('400px');
        });

        it('should create vertical splitter with title for the end container', function () {
            var splitter = new Splitter('vertical-splitter', {
                endContainerTitle: 'Some title'
            });
            var endContainer = splitter.$this.querySelector('end');

            endContainer.getAttribute('withheader').should.equal('true');
            endContainer.querySelector('header').innerText.should.equal('Some title');
        });

        it('should hide the start container', function () {
            var splitter = new Splitter('vertical-splitter', {
                hideStartContainer: true
            });

            splitter.$this.querySelector('start').style.display.should.equal('none');
        });

        it('should create vertical splitter with closable end container', function () {
            var splitter = new Splitter('vertical-splitter', {
                isEndContainerClosable: true
            });
            var endContainer = splitter.$this.querySelector('end');

            endContainer.getAttribute('verticalscrolling').should.equal('true');
            should.exist(endContainer.querySelector('close-button'));
        });

        it('should initialize the HTML for the divider', function () {
            var splitter = new Splitter('vertical-splitter');
            var divider = splitter.$this.querySelector('divider');

            should.exist(divider);
            divider.innerHTML.should.equal('<handler class="resize-handler"></handler>');
        });

    });

    describe('#hideEndContainer()', function () {
        it('should hide end container', function () {
            var splitter = new Splitter('vertical-splitter');

            splitter.hideEndContainer();

            splitter.$this.querySelector('end').style.display.should.equal('none');
        });
    });

    describe('#showEndContainer()', function () {
        it('should show end container', function () {
            var splitter = new Splitter('vertical-splitter');

            splitter.hideEndContainer();
            splitter.showEndContainer();

            should.not.exist(splitter.$this.querySelector('end').getAttribute('style'));
        });
    });

    describe('#_mouseMoveHandler()', function () {
        var splitter;
        var horizontalSplitter;
        var mockEvent = {
            clientY: 150,
            clientX: 150
        };

        beforeEach(function () {
            splitter = new Splitter('vertical-splitter');
            horizontalSplitter = new Splitter('horizontal-splitter');
        });

        afterEach(function () {
        });

        it('should change the style height of the end container', function () {
            var splitterRect = splitter.$this.getBoundingClientRect();
            var expectedResult = (splitterRect.top + splitterRect.height - mockEvent.clientY) + 'px';

            splitter._mouseMoveHandler(mockEvent);

            splitter._$endElement.style.height.should.be.equal(expectedResult);
        });

        it('should not change the style height of the start container', function () {
            splitter._mouseMoveHandler(mockEvent);

            splitter._$startElement.style.height.should.be.equal('');
        });

        it('should change the style width of the end container', function () {
            var horizontalSplitterRect = horizontalSplitter.$this.getBoundingClientRect();
            var expectedResult = (horizontalSplitterRect.left + horizontalSplitterRect.width - mockEvent.clientX) + 'px';

            horizontalSplitter._mouseMoveHandler(mockEvent);

            horizontalSplitter._$endElement.style.width.should.be.equal(expectedResult);
        });

        it('should not change the style width of the start container', function () {
            horizontalSplitter._mouseMoveHandler(mockEvent);

            horizontalSplitter._$startElement.style.width.should.be.equal('');
        });
    });

    describe('#_mouseUpHandler()', function () {
        var splitter;

        beforeEach(function () {
            splitter = new Splitter('vertical-splitter');
            splitter._mouseUpHandler();
        });

        afterEach(function () {
        });

        it('should delete references', function () {
            should.equal(document.onmousemove, null);
            should.equal(document.body.className, '');
        });
    });

    describe('#_mouseDownHandler()', function () {
        var splitter;
        var mockEvent;

        beforeEach(function () {
            mockEvent = {
                preventDefault: sinon.spy(),
                stopPropagation: sinon.spy()
            };
        });

        afterEach(function () {
            splitter._mouseUpHandler();
        });

        it('should call "#preventDefault()"', function () {
            splitter = new Splitter('vertical-splitter');
            splitter._mouseDownHandler(mockEvent);

            mockEvent.preventDefault.callCount.should.equal(1);
        });

        it('should call "#stopPropagation()"', function () {
            splitter = new Splitter('vertical-splitter');
            splitter._mouseDownHandler(mockEvent);

            mockEvent.stopPropagation.callCount.should.equal(1);
        });

        it('should call "#stopPropagation()"', function () {
            splitter = new Splitter('vertical-splitter');
            splitter._mouseDownHandler(mockEvent);

            mockEvent.stopPropagation.callCount.should.equal(1);
        });

        it('should add class to document.body', function () {
            splitter = new Splitter('vertical-splitter');
            splitter._mouseDownHandler(mockEvent);

            document.body.className.should.be.equal('user-is-resizing-vertically');
        });

        it('should add class to document.body', function () {
            splitter = new Splitter('horizontal-splitter');
            splitter._mouseDownHandler(mockEvent);

            document.body.className.should.be.equal('user-is-resizing-horizontally');
        });

        it('should create handler for mouse move', function () {
            splitter = new Splitter('horizontal-splitter');
            splitter._mouseDownHandler(mockEvent);

            splitter.$this.onmousemove.should.be.a('function');
        });

        it('should create handler for mouse up', function () {
            splitter = new Splitter('horizontal-splitter');
            splitter._mouseDownHandler(mockEvent);

            splitter.$this.onmouseup.should.be.a('function');
        });

        it('should call "requestAnimationFrame()"', function () {
            var requestAnimationFrame = sinon.spy(window, 'requestAnimationFrame');

            splitter._mouseDownHandler(mockEvent);
            splitter.$this.onmousemove(mockEvent);

            requestAnimationFrame.callCount.should.be.equal(1);
        });

    });

    describe('UI tests', function () {
        var splitter;

        beforeEach(function () {
            splitter = new Splitter('vertical-splitter', {
                hideEndContainer: true,
                isEndContainerClosable: true
            });
        });

        afterEach(function () {
        });

        describe('Close button', function () {
            it('should has click event handler', function () {
                splitter.$this.querySelector('close-button').onclick.should.be.a('function');
            });

            it('should be visible when the end container is visible', function () {
                var closeButton = splitter.$this.querySelector('close-button');

                splitter.showEndContainer();

                closeButton.style.display.should.be.equal('block');
            });

            it('should not be visible the end container is not vissible', function () {
                var closeButton = splitter.$this.querySelector('close-button');

                splitter.showEndContainer();
                splitter.hideEndContainer();

                closeButton.style.display.should.be.equal('none');
            });
        });
    });
});
