/* globals createElementWithClass */

const DataGrid = require('../ui/datagrid/DataGrid.js');

const BATCH_ICON = 128194;
const REQUEST_ICON = 128463;

class ODataNode extends DataGrid.SortableDataGridNode {

    createCell(columnId) {
        const cell = super.createCell(columnId);
        if (columnId === 'name') {
            this._renderPrimaryCell(cell, columnId);
        }

        return cell;
    }

    _renderPrimaryCell(cell) {
        const iconElement = createElementWithClass('span', 'icon');
        const iSymbol = (this.data.isBatch) ? BATCH_ICON : REQUEST_ICON;
        const sClass = (this.data.isBatch) ? 'batchIcon' : 'requestIcon';

        iconElement.classList.add(sClass);
        iconElement.innerHTML = `&#${iSymbol}`;
        cell.prepend(iconElement);

        cell.title = this.data.url;
    }
}

module.exports = ODataNode;
