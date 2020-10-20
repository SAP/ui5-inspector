/* globals createElementWithClass */

const DataGrid = require('../ui/datagrid/DataGrid.js');

class ODataNode extends DataGrid.SortableDataGridNode {
    constructor(data) {
        super(data);
    }

    createCell(columnId) {
        const cell = super.createCell(columnId);
        if (columnId === 'name') {
            this._renderPrimaryCell(cell, columnId);
        }

        return cell;
    }

    _renderPrimaryCell(cell) {
        const iconElement = createElementWithClass('span', 'icon'),
            iSymbol = (this.data.isBatch) ? 128194 : 128463,
            sClass = (this.data.isBatch) ? 'batchIcon' : 'requestIcon';

        iconElement.classList.add(sClass);
        iconElement.innerHTML = `&#${iSymbol}`;
        cell.prepend(iconElement);

        cell.title = this.data.url;
    }
}

module.exports = ODataNode;
