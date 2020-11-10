'use strict';

/**
 * @param {string} containerId - id of the DOM container
 * @constructor
 */
function ODataDetailView(containerId) {
    const darkModeMql = matchMedia('(prefers-color-scheme: dark)');
    const darkMode = darkModeMql.matches;

    this.oContainer = document.getElementById(containerId);
    this.editorDOM = document.createElement('div');
    this.editorDOM.id = 'editor';
    this.oContainer.appendChild(this.editorDOM);

    this.editorAltDOM = document.createElement('div');
    this.editorAltDOM.classList.add('editorAlt');
    this.editorAltMessageDOM = document.createElement('div');
    this.oContainer.appendChild(this.editorAltDOM);
    this.editorAltDOM.appendChild(this.editorAltMessageDOM);

    this.editor = ace.edit('editor');
    this.editor.getSession().setUseWrapMode(true);

    darkModeMql.addListener(function (event) {
        this._setTheme(event.matches);
    }.bind(this));
    this._setTheme(darkMode);
}

/**
 * Updates data.
 * @param {Object} data - object structure as JSON
 */
ODataDetailView.prototype.update = function (data) {
    const sResponseBody = data.responseBody;
    let sAltMessage;

    this.editorDOM.classList.toggle('hidden', !sResponseBody);
    this.editorAltDOM.classList.toggle('hidden', !!sResponseBody);

    if (sResponseBody) {
        this.editor.session.setMode('ace/mode/' + sResponseBody.type);
        this.editor.setValue(sResponseBody.content, 0);
    } else {
        sAltMessage = data.altMessage || 'No response body';
        this.editorAltMessageDOM.innerText = sAltMessage;
    }

    this.editor.clearSelection();
};

/**
 * Clears editor.
 */
ODataDetailView.prototype.clear = function () {
    this.editor.setValue('', -1);
};

/**
 * Sets theme.
 */
ODataDetailView.prototype._setTheme = function (darkMode) {
    // DarkMode = chrome.devtools.panels.themeName === "dark" || darkMode //Hardwired to chrome devtools to dark?
    this.editor.setTheme(darkMode ? 'ace/theme/vibrant_ink' : 'ace/theme/chrome');
};

module.exports = ODataDetailView;
