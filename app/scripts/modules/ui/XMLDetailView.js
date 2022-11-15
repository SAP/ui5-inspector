/* globals ResizeObserver */

'use strict';
const formatXML = require('prettify-xml');
const NOXMLVIEWMESSAGE = 'Select a \'sap.ui.core.mvc.XMLView\' to see its XML content. Click to filter on XMLViews';

/**
 * @param {string} containerId - id of the DOM container
 * @constructor
 */
function XMLDetailView(containerId) {
    this.oContainer = document.getElementById(containerId);
    this.oEditorDOM = document.createElement('div');
    this.oEditorDOM.id = 'xmlEditor';
    this.oEditorDOM.classList.toggle('hidden', true);
    this.oContainer.appendChild(this.oEditorDOM);

    this.oEditorAltDOM = document.createElement('div');
    this.oEditorAltDOM.classList.add('editorAlt');
    this.oEditorAltDOM.classList.toggle('hidden', false);
    this.oEditorAltMessageDOM = document.createElement('div');
    this.oEditorAltMessageDOM.innerText = NOXMLVIEWMESSAGE;

    this.oEditorAltMessageDOM.addEventListener('click', function() {
        var searchField = document.getElementById('elementsRegistrySearch');
        var filterCheckbox = document.getElementById('elementsRegistryCheckbox');
        searchField.value = 'sap.ui.core.mvc.XMLView';
        if (!filterCheckbox.checked) {
            filterCheckbox.click();
        }
        return false;
    });
    this.oContainer.appendChild(this.oEditorAltDOM);
    this.oEditorAltDOM.appendChild(this.oEditorAltMessageDOM);

    this.oEditor = ace.edit(this.oEditorDOM.id);
    this.oEditor.getSession().setUseWrapMode(true);

    this._setTheme();

    const oResizeObserver = new ResizeObserver(function () {
        this.oEditor.resize();
    }.bind(this));
    oResizeObserver.observe(this.oEditorDOM);
}

/**
 * Updates data.
 * @param {Object} data - object structure as JSON
 */
XMLDetailView.prototype.update = function (data) {
    const xml = data.xml && formatXML(data.xml);
    let sAltMessage;

    this.oEditorDOM.classList.toggle('hidden', !xml);
    this.oEditorAltDOM.classList.toggle('hidden', !!xml);

    if (xml) {
        this.oEditor.session.setMode('ace/mode/xml');
        this.oEditor.setValue(xml, 0);
    } else {
        sAltMessage = data.altMessage || NOXMLVIEWMESSAGE;
        this.oEditorAltMessageDOM.innerText = sAltMessage;
    }

    this.oEditor.clearSelection();
};

/**
 * Clears editor.
 */
XMLDetailView.prototype.clear = function () {
    this.oEditor.setValue('', -1);
};

/**
 * Sets theme.
 */
XMLDetailView.prototype._setTheme = function () {
    var bDarkMode = chrome.devtools.panels.themeName === 'dark';

    this.oEditor.setTheme(bDarkMode ? 'ace/theme/vibrant_ink' : 'ace/theme/chrome');
};

module.exports = XMLDetailView;
