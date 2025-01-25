const undoStack = [];
let leadIndex = -1;
function add(undoState) {
    if(leadIndex<undoStack.length-1) {
        undoStack.splice(leadIndex+1);
    }
    undoStack.push(undoState);
}

function undo() {
    leadIndex--;
}

function redo() {
    leadIndex++;
}

export { addUndo };
