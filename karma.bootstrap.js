/*global document, window*/
(function (window) {
    'use strict';

    document.body.innerHTML += '<div id="fixtures"></div>';

    window.assert = chai.assert;
    window.expect = chai.expect;
    window.should = chai.should();
})(window);
