'use strict';

/**
 * FrameSelect constructor
 * @param {string} id - The id of the DOM container
 * @param {object} options
 * @constructor
 */
 function FrameSelect(id, options) {
    this._sltDomRef = document.getElementById(id).querySelector('select');
    // Chrome treats the main window as the default frame with id 0
    this._selectedId = 0;
    this.onSelectionChange = options.onSelectionChange ? options.onSelectionChange : function () {};

    this._sltDomRef.addEventListener('change', function(event) {
        var selectedId = parseInt(event.target.value);
        var oldSelectedId = this._selectedId;
        this._selectedId = selectedId;
        this.onSelectionChange({selectedId, oldSelectedId});
    }.bind(this));
}

FrameSelect.prototype.getSelectedId = function () {
    return this._selectedId;
};

FrameSelect.prototype.setSelectedId = function (frameId) {
    this._sltDomRef.value = frameId;
    this._selectedId = frameId;
};

FrameSelect.prototype.setData = function (data) {
    var frameIds = Object.keys(data).map( x => parseInt(x));
    var selectedId;
    var oldSelectedId;

    this._sltDomRef.innerHTML = '';
    frameIds.forEach(function(frameId) {
        this._addOption(frameId, data[frameId]);
    }, this);
    if (frameIds.indexOf(this._selectedId) < 0) {
        // the previously selected id is no loger found
        // (e.g. frame deleted)
        // => reset selection to the top frame
        selectedId = 0;
        oldSelectedId = this._selectedId;
        this.setSelectedId(selectedId);
        this.onSelectionChange({selectedId, oldSelectedId});
    }
    this._sltDomRef.hidden = false;
};

FrameSelect.prototype._addOption = function (frameId, data) {
    var option = document.createElement('option');
    option.value = frameId;
    option.innerText = this._getFrameLabel(frameId, data.url);
    this._sltDomRef.appendChild(option);
};

FrameSelect.prototype._getFrameLabel = function (frameId, frameUrl) {
    if (frameId === 0) {
        return 'top';
    }
    var aUrl = frameUrl.split('/');
    return aUrl[aUrl.length - 1];
};

module.exports = FrameSelect;
