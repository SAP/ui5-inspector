'use strict';

/**
 * @param {string} containerId - id of the DOM container
 * @constructor
 */
function ODataDetailView(containerId) {
    const darkModeMql = matchMedia('(prefers-color-scheme: dark)');
    const darkMode = darkModeMql.matches;

    this.oContainer = document.getElementById(containerId);
    this.oEditorDOM = document.createElement('div');
    this.oEditorDOM.id = 'editor';
    this.oContainer.appendChild(this.oEditorDOM);

    this.oEditorAltDOM = document.createElement('div');
    this.oEditorAltDOM.classList.add('editorAlt');
    this.oEditorAltMessageDOM = document.createElement('div');
    this.oContainer.appendChild(this.oEditorAltDOM);
    this.oEditorAltDOM.appendChild(this.oEditorAltMessageDOM);

    this.oEditor = ace.edit('editor');
    this.oEditor.getSession().setUseWrapMode(true);

    /**
     * @param {Object} event
     */
    darkModeMql.addListener(event => {
        this._setTheme(event.matches);
    });
    this._setTheme(darkMode);
}

/**
 * Updates data.
 * @param {Object} data - object structure as JSON
 */
ODataDetailView.prototype.update = function (data) {
    const sResponseBody = data.responseBody;
    let sAltMessage;

    this.oEditorDOM.classList.toggle('hidden', !sResponseBody);
    this.oEditorAltDOM.classList.toggle('hidden', !!sResponseBody);

    if (sResponseBody) {
        this.oEditor.session.setMode('ace/mode/' + sResponseBody.type);
        this.oEditor.setValue(sResponseBody.content, 0);
    } else {
        sAltMessage = data.altMessage || 'No response body';
        this.oEditorAltMessageDOM.innerText = sAltMessage;
    }

    this.oEditor.clearSelection();
};

/**
 * Clears editor.
 */
ODataDetailView.prototype.clear = function () {
    this.oEditor.setValue('', -1);
};

/**
 * Sets theme.
 */
ODataDetailView.prototype._setTheme = function (darkMode) {
    // DarkMode = chrome.devtools.panels.themeName === "dark" || darkMode //Hardwired to chrome devtools to dark?
    this.oEditor.setTheme(darkMode ? 'ace/theme/vibrant_ink' : 'ace/theme/chrome');
};

module.exports = ODataDetailView;
