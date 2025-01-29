import { undoIcons } from "./menu.js";

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

class Undo {
    constructor(selectedIndex, cells) {
        this.grid = new Uint8Array(81);
        this.candidate = new Uint8Array(81);
        if (cells) {
            for (let i = 0; i < 81; i++) {
                const cell = cells[i];
                this.grid[i] = cell.symbol;
                this.candidate[i] = cell.mask;
            }
        }
        this.selectedIndex = selectedIndex;
    }
    apply(cells) {
        for (let i = 0; i < 81; i++) {
            const cell = cells[i];
            cell.symbol = this.grid[i];
            cell.mask = this.candidate[i];
        }
        return this.selectedIndex;
    }
    equals(cells, selectedIndex) {
        if (selectedIndex !== this.selectedIndex) return false;
        for (let i = 0; i < 81; i++) {
            const cell = cells[i];
            if (cell.symbol !== this.grid[i]) return false;
            if (cell.mask !== this.candidate[i]) return false;
        }
        return true;
    }
}

function set(cells) {
    leadIndex = 0;
    undoStack.splice(0, Infinity, new Undo(-1, cells));
    setIconState();
}

function add(cells, selectedIndex) {
    if (leadIndex >= 0) {
        const lead = undoStack[leadIndex];
        if (lead.equals(cells, selectedIndex)) return;
    }

    if (leadIndex < undoStack.length - 1) undoStack.splice(leadIndex + 1);
    leadIndex = undoStack.length;
    undoStack.push(new Undo(selectedIndex, cells));

    setIconState();
}

function undo(cells) {
    if (leadIndex < 1) return;
    leadIndex--;
    setIconState();
    return undoStack[leadIndex].apply(cells);
}

function redo(cells) {
    if (leadIndex >= undoStack.length - 1) return;
    leadIndex++;
    setIconState();
    return undoStack[leadIndex].apply(cells);
}

function saveData() {
    const dataStack = [];
    for (const undo of undoStack) {
        const data = {
            grid: undo.grid.join(""),
            candidate: undo.candidate.join(""),
            selectedIndex: undo.selectedIndex,
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
            undo.grid[i] = parseInt(undoData.grid[i]);
            undo.candidate[i] = parseInt(undoData.candidate[i]);
        }
        dataStack.push(undo);
    }

    undoStack.splice(0, Infinity, ...dataStack);
    leadIndex = data.leadIndex;
    setIconState();
}

export { set, add, undo, redo, saveData, loadData };
