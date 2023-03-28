
'use strict';
const NOCONTROLLERMESSAGE = 'Select a \'sap.ui.core.mvc.XMLView\' to see its Controller content. Click to filter on XMLViews';
const CONTROLLERNAME = 'Name:';
const CONTROLLERPATH = 'Relative Path:';
/**
 * @param {string} containerId - id of the DOM container
 * @constructor
 */
function ControllerDetailView(containerId) {
	this.oContainer = document.getElementById(containerId);
	this.oEditorDOM = document.createElement('div');
	this.oEditorDOM.id = 'controllerEditor';
	this.oEditorDOM.classList.toggle('hidden', true);
	this.oContainer.appendChild(this.oEditorDOM);

	this.oNamePlaceholderDOM = document.createElement('div');
	this.oNamePlaceholderDOM.classList.add('longTextReduce');
	this.oNamePlaceholderDOM.onclick = this._selectAllText;
	this.oPathPlaceholderDOM = document.createElement('div');
	this.oPathPlaceholderDOM.classList.add('longTextReduce');
	this.oPathPlaceholderDOM.onclick = this._selectAllText;
	this.oNameDOM = document.createElement('div');
	this.oNameDOM.classList.add('firstColAlignment');
	this.oNameDOM.innerText = CONTROLLERNAME;
	this.oPathDOM = document.createElement('div');
	this.oPathDOM.classList.add('firstColAlignment');
	this.oPathDOM.innerText = CONTROLLERPATH;
	this.oEditorDOM.appendChild(this.oNameDOM);
	this.oEditorDOM.appendChild(this.oNamePlaceholderDOM);
	this.oEditorDOM.appendChild(this.oPathDOM);
	this.oEditorDOM.appendChild(this.oPathPlaceholderDOM);

	this.oEditorAltDOM = document.createElement('div');
	this.oEditorAltDOM.classList.add('editorAlt');
	this.oEditorAltDOM.classList.toggle('hidden', false);
	this.oEditorAltMessageDOM = document.createElement('div');
	this.oEditorAltMessageDOM.innerText = NOCONTROLLERMESSAGE;

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
}

/**
 * Updates data.
 * @param {Object} data - object structure as JSON
 */
ControllerDetailView.prototype.update = function (controllerInfo) {

	var bIsDataValid = !!(controllerInfo.sControllerName && controllerInfo.sControllerRelPath);

	this.oEditorDOM.classList.toggle('hidden', !bIsDataValid);
	this.oEditorAltDOM.classList.toggle('hidden', bIsDataValid);

	if (bIsDataValid) {
		this.oNamePlaceholderDOM.innerText = controllerInfo.sControllerName;
		this.oPathPlaceholderDOM.innerText = controllerInfo.sControllerRelPath;
	}
};

ControllerDetailView.prototype._selectAllText = function (oEvent) {
	var range = document.createRange();
	range.selectNode(oEvent.target);
	window.getSelection().removeAllRanges();
	window.getSelection().addRange(range);
};


module.exports = ControllerDetailView;
