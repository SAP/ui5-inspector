'use strict';

function ODataDetailView(containerId) {

   this.oContainer = document.getElementById(containerId);

    this.editorDOM = document.createElement("div");
    this.editorDOM.id ='editor';
    this.oContainer.appendChild(this.editorDOM);


    this.editorAltDOM = document.createElement("div");
    this.editorAltDOM.classList.add('editorAlt');
    this.editorAltMessageDOM = document.createElement("div");
    this.oContainer.appendChild(this.editorAltDOM);
    this.editorAltDOM.appendChild(this.editorAltMessageDOM);


    this.editor = ace.edit("editor");
    this.editor.getSession().setUseWrapMode(true);


    const darkModeMql = matchMedia("(prefers-color-scheme: dark)");
    const darkMode = darkModeMql.matches;
    darkModeMql.addListener(function(event) {
        this._setTheme(event.matches);
    }.bind(this));
    this._setTheme(darkMode);
}

ODataDetailView.prototype.update = function(data) {
    var sResponseBody = data.responseBody,
        sAltMessage;
    this.editorDOM.classList.toggle("hidden", !sResponseBody);
    this.editorAltDOM.classList.toggle("hidden", !!sResponseBody);
    if (sResponseBody) {
        this.editor.session.setMode("ace/mode/" + sResponseBody.type);
        this.editor.setValue(sResponseBody.content, 0);
    } else {
        sAltMessage = data.altMessage || "No response body";
        this.editorAltMessageDOM.innerText = sAltMessage;
    }
    this.editor.clearSelection()
};

ODataDetailView.prototype.clear = function() {
    this.editor.setValue("", -1);
};

ODataDetailView.prototype._setTheme = function(darkMode) {
    // darkMode = chrome.devtools.panels.themeName === "dark" || darkMode //Hardwired to chrome devtools to dark?
    this.editor.setTheme(darkMode ? "ace/theme/vibrant_ink" : "ace/theme/chrome")
};

module.exports = ODataDetailView;
