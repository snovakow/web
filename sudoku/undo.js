import { undoIcons } from "./menu.js";

const undoStackMax = 100;
const undoStack = [];
let leadIndex = -1;

const setIconState = () => {
    if (leadIndex > 0) {
        undoIcons.undo_on.style.display = 'block';
        undoIcons.undo_off.style.display = 'none';
    } else {
        undoIcons.undo_on.style.display = 'none';
        undoIcons.undo_off.style.display = 'block';
    }
    if (leadIndex < undoStack.length - 1) {
        undoIcons.redo_on.style.display = 'block';
        undoIcons.redo_off.style.display = 'none';
    } else {
        undoIcons.redo_on.style.display = 'none';
        undoIcons.redo_off.style.display = 'block';
    }
};
setIconState();

class UndoCell {
    constructor(cell) {
        if (cell) {
            this.symbol = cell.symbol;
            this.mask = cell.mask;
        } else {
            this.symbol = 0;
            this.mask = 0x0000;
        }
    }
    assignTo(cell) {
        cell.symbol = this.symbol;
        cell.mask = this.mask;
    }
    assign(data) {
        this.symbol = data.symbol;
        this.mask = data.mask;
    }
    equals(cell) {
        if (cell.symbol !== this.symbol) return false;
        if (cell.mask !== this.mask) return false;
        return true;
    }
}
class Undo {
    constructor(selectedIndex, board) {
        this.cells = [];
        for (let i = 0; i < 81; i++) this.cells[i] = new UndoCell(board?.cells?.[i]);
        this.selectedIndex = selectedIndex;
    }
    apply(board) {
        for (let i = 0; i < 81; i++) {
            this.cells[i].assignTo(board.cells[i]);
        }
        return this.selectedIndex;
    }
    equals(cells, selectedIndex) {
        if (selectedIndex !== this.selectedIndex) return false;
        for (let i = 0; i < 81; i++) {
            if (!this.cells[i].equals(cells[i])) return false;
        }
        return true;
    }
}

function set(board) {
    let needsUndo = false;
    for (let i = 0; i < 81; i++) {
        const cell = board.cells[i];
        if (cell.symbol !== board.startCells[i].symbol) {
            needsUndo = true;
            break;
        }
    }
    if (needsUndo) {
        const undo = new Undo(-1);
        for (let i = 0; i < 81; i++) {
            undo.cells[i].symbol = board.startCells[i].symbol;
        }
        undoStack.splice(0, Infinity, undo, new Undo(-1, board));
    } else {
        undoStack.splice(0, Infinity, new Undo(-1, board));
    }
    leadIndex = undoStack.length - 1;
    setIconState();
}

function clear() {
    leadIndex = -1;
    undoStack.splice(0, Infinity);
    setIconState();
}

function add(board, selectedIndex) {
    if (leadIndex >= 0) {
        const lead = undoStack[leadIndex];
        if (lead.equals(board.cells, selectedIndex)) return;
    }

    if (leadIndex < undoStack.length - 1) undoStack.splice(leadIndex + 1);
    undoStack.push(new Undo(selectedIndex, board));

    if (undoStack.length > undoStackMax) {
        undoStack.splice(0, undoStack.length - undoStackMax);
    }
    leadIndex = undoStack.length - 1;

    setIconState();
}

function undo(board) {
    if (leadIndex < 1) return;
    leadIndex--;
    setIconState();
    return undoStack[leadIndex].apply(board);
}

function redo(board) {
    if (leadIndex >= undoStack.length - 1) return;
    leadIndex++;
    setIconState();
    return undoStack[leadIndex].apply(board);
}

function saveData() {
    const dataStack = [];
    for (const undo of undoStack) {
        const undoCells = [];
        for (let i = 0; i < 81; i++) {
            const cellData = {};
            undo.cells[i].assignTo(cellData);
            undoCells[i] = cellData;
        }
        const data = {
            cells: undoCells,
            selectedIndex: undo.selectedIndex
        };
        dataStack.push(data);
    }
    return {
        undoStack: dataStack,
        leadIndex,
    };
}

function loadData(data) {
    const dataStack = [];
    for (const undoData of data.undoStack) {
        const undo = new Undo(undoData.selectedIndex);
        for (let i = 0; i < 81; i++) {
            undo.cells[i].assign(undoData.cells[i]);
        }
        dataStack.push(undo);
    }

    undoStack.splice(0, Infinity, ...dataStack);
    leadIndex = data.leadIndex;
    setIconState();
}

export { set, clear, add, undo, redo, saveData, loadData };
