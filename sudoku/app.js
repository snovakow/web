import { FONT, board, clearGrid, loadGrid, saveGrid } from "../sudokulib/board.js";
import { generateFromSeed, generateTransform, fillSolve, consoleOut } from "../sudokulib/generator.js";
import { CellCandidate, Grid } from "../sudokulib/Grid.js";
import * as PICKER from "../sudokulib/picker.js";
import { candidates } from "../sudokulib/solver.js";
import * as Menu from "./menu.js";
import * as Undo from "./undo.js";
import * as SudokuProcess from "../sudokulib/process.js";
import { Animator } from "./Animator.js";
import { Panel, AlertPanel, FramePanel } from "./Panel.js";

const picker = PICKER.picker;
const pickerDraw = PICKER.pickerDraw;
const pickerMarker = PICKER.pickerMarker;
const pixAlign = PICKER.pixAlign;

let levelMode = true;
let strategy = "level";
{
	const searchParams = new URLSearchParams(window.location.search);
	const strategySearch = searchParams.get("strategy");
	const strategyNames = [
		"naked2",
		"naked3",
		"naked4",
		"hidden1",
		"hidden2",
		"hidden3",
		"hidden4",
		"omissions",
		"uniqueRectangle",
		"yWing",
		"xyzWing",
		"xWing",
		"swordfish",
		"jellyfish",
		"hardcoded",
	];
	for (const tableName of strategyNames) {
		if (strategySearch === tableName) {
			strategy = tableName;
			levelMode = false;
			break;
		}
	}
}

Menu.markerButton.style.display = "block";
if (!levelMode) {
	Menu.menu.style.display = "block";
	Menu.autoBar.style.display = "block flex";
}

const puzzleData = {
	id: null,
	transform: null,
}
Object.seal(puzzleData);

const headerHeight = Menu.headerHeight;
const footerHeight = 8;
const spacing = 8;

let pickerMarkerMode = false;
let selectedRow = 0;
let selectedCol = 0;
let selected = false;

const saveData = () => {
	saveGrid({
		id: puzzleData.id,
		strategy: strategy,
		transform: puzzleData.transform,
		pickerMarkerMode,
		selected,
		selectedRow,
		selectedCol,
		errorCells: [...board.errorCells],
		undo: Undo.saveData()
	}, strategy === 'hardcoded');
};

const draw = () => {
	board.draw(selected, selectedRow, selectedCol);

	const selectedSet = new Set();
	if (selected) {
		const selectedIndex = selectedRow * 9 + selectedCol;
		const cell = board.cells[selectedIndex];
		if (pickerMarkerMode) {
			if (cell.symbol === 0) {
				for (let x = 1; x <= 9; x++) {
					if (cell.has(x)) selectedSet.add(x);
				}
			}
		} else {
			if (cell.symbol !== 0) selectedSet.add(cell.symbol);
		}
	}

	const font = pixAlign(PICKER.cellSize * window.devicePixelRatio) + "px " + FONT;
	const fontMarker = pixAlign(PICKER.cellSize * 3 / 8 * window.devicePixelRatio) + "px " + FONT;
	pickerDraw(selectedSet, font, fontMarker);
}

let timer = 0;
let superpositionMode = 0;
let superimposeCandidates = null;

const puzzleFinished = () => {
	if (board.puzzleSolved) {
		for (let i = 0; i < 81; i++) {
			if (board.cells[i].symbol !== board.puzzleSolved[i]) return false;
		}
	} else {
		for (const group of Grid.groupTypes) {
			let set = 0x0000;
			for (const i of group) set |= (0x0001 << board.cells[i].symbol);
			if (set !== 0x03FE) return false;
		}
	}
	return true;
}

const click = (event) => {
	// event.preventDefault();
	if (findAnimating) return;

	const rect = event.target.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;

	const [row, col] = board.hitDetect(x, y, rect.width);

	if (row < 0 || col < 0) return;

	if (board.startCells[row * 9 + col].symbol !== 0) return;

	if (selected && selectedRow === row && selectedCol === col) {
		selected = false;
	} else {
		selectedRow = row;
		selectedCol = col;

		selected = true;
		if (timer && superpositionMode === 0 && superimposeCandidates) superimposeCandidates(true);
	}
	draw();
	saveData();
};
board.canvas.addEventListener('click', click);

const clickLocation = (event) => {
	const rect = event.target.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;

	const sizeTotal = rect.width;

	const r = Math.floor(y / sizeTotal * 3);
	const c = Math.floor(x / sizeTotal * 3);
	return [r, c];
};

const numberEntry = (pickerSymbol) => {
	const running = timer ? true : false;
	if (timer && superimposeCandidates) superimposeCandidates(false);

	const selectedIndex = selectedRow * 9 + selectedCol;
	const cell = board.cells[selectedIndex];
	if (pickerMarkerMode) {
		if (pickerSymbol === 0) {
			if (cell.symbol === 0 && cell.mask === 0x0000) return;
			cell.setSymbol(0);
		} else {
			if (cell.symbol === 0) {
				const had = cell.delete(pickerSymbol);
				if (!had) cell.add(pickerSymbol);
			} else {
				cell.setSymbol(0);
				cell.add(pickerSymbol);
			}
		}
	} else {
		if (pickerSymbol === cell.symbol) return;
		cell.setSymbol(pickerSymbol);
		// Toggle
		// if (pickerSymbol === cell.symbol) cell.setSymbol(0);
		// else cell.setSymbol(pickerSymbol);
	}
	board.errorCells.delete(selectedIndex);

	Undo.add(board, selectedIndex);
	saveData();
	draw();

	if (running) {
		fillSolve(board.cells, null, []);
		saveData();
		if (superimposeCandidates) superimposeCandidates();
	}

	if (!pickerMarkerMode && puzzleFinished()) {
		AlertPanel.alert("Puzzle Complete!!!");
	}
}
const pickerClick = (event) => {
	if (!selected) return;
	const [r, c] = clickLocation(event);
	numberEntry(r * 3 + c + 1);
};
picker.addEventListener('click', pickerClick);
pickerMarker.addEventListener('click', pickerClick);

const setMarkerButton = () => {
	Menu.markerButton.title = pickerMarkerMode ? "Digits" : "Candidates";
}
const toggleMarkerMode = () => {
	pickerMarkerMode = !pickerMarkerMode;
	setMarkerButton();
	setMarkerMode();
	saveData();
	draw();
}
Menu.markerButton.addEventListener('click', () => {
	toggleMarkerMode();
});
setMarkerButton();

document.body.addEventListener('keydown', event => {
	if (event.key === " ") {
		event.preventDefault();
		toggleMarkerMode();
		return;
	}
	// if (event.key === "Backspace") {
	// 	event.preventDefault();
	// 	numberEntry(0);
	// 	return;
	// }

	if (!selected) return;
	switch (event.key) {
		case "1":
		case "2":
		case "3":
		case "4":
		case "5":
		case "6":
		case "7":
		case "8":
		case "9":
			event.preventDefault();
			numberEntry(parseInt(event.key));
	}
});

const onFocus = () => {
	resize();
	draw();
};
const offFocus = () => {

};
// window.addEventListener("focus", onFocus);
// window.addEventListener("blur", offFocus);

const pickerContainer = document.createElement('span');
pickerContainer.style.position = 'absolute';
pickerContainer.style.width = PICKER.cellsSize + 'px';
pickerContainer.style.height = PICKER.cellsSize + 'px';

const orientationchange = (event) => {
	draw();
	console.log(event);
};
addEventListener("orientationchange", orientationchange);

picker.style.position = 'absolute';
picker.style.width = PICKER.cellsSize + 'px';
picker.style.height = PICKER.cellsSize + 'px';

pickerMarker.style.position = 'absolute';
pickerMarker.style.width = PICKER.cellsSize + 'px';
pickerMarker.style.height = PICKER.cellsSize + 'px';

board.canvas.style.position = 'absolute';
board.canvas.style.touchAction = "manipulation";
picker.style.touchAction = "manipulation";
pickerMarker.style.touchAction = "manipulation";

const header = document.createElement('DIV');
const mainBody = document.createElement('DIV');

let loaded = false;
const clearData = () => {
	pickerMarkerMode = false;
	selected = false;
	selectedRow = 0;
	selectedCol = 0;
	board.errorCells.clear();
	clearGrid();
};

const loadGridData = (hash) => {
	if (!levelMode && strategy !== 'hardcoded') Menu.setMenuItem(strategy);

	const loadGridData = loadGrid(hash, strategy === 'hardcoded');
	if (!loadGridData) return;

	if (loadGridData.metadata) {
		const metadata = loadGridData.metadata;
		if (metadata.strategy !== strategy) return;

		if (metadata.selected !== undefined) selected = metadata.selected;
		if (metadata.selectedRow !== undefined) selectedRow = metadata.selectedRow;
		if (metadata.selectedCol !== undefined) selectedCol = metadata.selectedCol;

		if (metadata.id !== undefined) puzzleData.id = metadata.id;
		if (metadata.transform !== undefined) puzzleData.transform = metadata.transform;

		if (metadata.pickerMarkerMode !== undefined) pickerMarkerMode = metadata.pickerMarkerMode;

		board.errorCells.clear();
		for (const error of metadata.errorCells) board.errorCells.add(error);

		Undo.loadData(metadata.undo);

		loaded = true;
	} else {
		loaded = loadGridData.coded;
		if (loaded) Undo.set(board);
	}
	draw();
}
loadGridData(window.location.hash.substring(1));

window.addEventListener("hashchange", (event) => {
	const url = new URL(event.newURL);
	clearData();
	loadGridData(url.hash.substring(1));
	saveData();

	if (foundPanel) {
		foundPanel.hide();
		foundPanel = null;
	}
	if (infoPanel) {
		infoPanel.hide();
	}
	AlertPanel.hide();

	draw();
});

Menu.setMenuReponse((responseStrategy) => {
	if (strategy === responseStrategy) return false;
	const message = "Do you want to start a " + Menu.menuTitle(responseStrategy) + " puzzle?";
	Menu.setMenuItem(responseStrategy);
	AlertPanel.confirm(message, confirmed => {
		if (confirmed) {
			history.replaceState(null, "", "?strategy=" + responseStrategy);
			window.location.reload();
		} else {
			Menu.setMenuItem(strategy);
		}
	});
});

const setMarkerMode = () => {
	if (pickerMarkerMode) {
		picker.style.visibility = "hidden";
		pickerMarker.style.visibility = "visible";
	} else {
		picker.style.visibility = "visible";
		pickerMarker.style.visibility = "hidden";
	}
}
setMarkerMode();

const title = document.createElement('SPAN');

let customSelector = null;
if (strategy === 'hardcoded') {
	const createSelect = (options, onChange) => {
		const select = document.createElement('select');

		for (const title of options) {
			const option = document.createElement('option');
			option.text = title;
			select.appendChild(option);
		}

		select.addEventListener('change', () => {
			onChange(select);
		});
		return select;
	};

	fetch("../sudokulib/sudoku.php?version=2&strategy=" + strategy).then(response => {
		response.json().then((json) => {
			const entries = [];
			const names = [];
			for (const result of json) {
				const id = result.id;
				const title = result.title;
				let puzzleData = result.puzzleData;

				if (puzzleData.length !== 81) return;
				entries.push({ id, title, puzzleData });

				names.push(title);
			}

			customSelector = createSelect(["-", ...names], (select) => {
				let message = "Do you want to clear the puzzle?";
				if (select.selectedIndex > 0) message = `Do you want to load "${names[select.selectedIndex - 1]}"?`;
				AlertPanel.confirm(message, confirmed => {
					if (!confirmed) {
						select.selectedIndex = puzzleData.id ?? 0;
						return;
					}

					selected = false;

					if (select.selectedIndex === 0) {
						for (const cell of board.cells) {
							cell.symbol = 0;
							cell.mask = 0x0000;
						}
						for (const cell of board.startCells) cell.symbol = 0;

						puzzleData.id = "";
					} else {
						const index = select.selectedIndex - 1;
						const entry = entries[index];
						board.setGrid(entry.puzzleData);

						puzzleData.id = entry.id;
					}
					puzzleData.transform = null;
					board.puzzleSolved.fill(0);
					board.errorCells.clear();

					Undo.set(board);
					saveData();
					draw();
				});
			});

			customSelector.style.transform = 'translate(-50%, -50%)';
			customSelector.style.position = 'absolute';
			customSelector.style.top = 0 + 'px';
			title.appendChild(customSelector);

			if (!puzzleData.transform && puzzleData.id !== "") {
				for (let i = 0; i < entries.length; i++) {
					const entry = entries[i];
					if (parseInt(entry.id) === parseInt(puzzleData.id)) {
						customSelector.selectedIndex = i + 1;
						break;
					}
				}
			}
		});
	});
}

let findAnimating = false;
let foundPanel = null;
let infoPanel = null;

const loadLevel = () => {
	const worker_url = new URL("./worker_finder.js", import.meta.url);
	const worker = new Worker(worker_url, { type: "module" });
	const animator = new Animator();
	findAnimating = true;

	let tickMark = -1;

	board.errorCells.clear();
	Undo.clear();
	selected = false;

	const animation = (timestamp) => {
		const animationId = requestAnimationFrame(animation);

		const tick = Math.floor(timestamp / Animator.TICK_RATE);
		if (tick === tickMark) return;
		tickMark = tick;

		const complete = animator.update(timestamp);
		if (complete) {
			cancelAnimationFrame(animationId);
			const data = complete.data;
			const puzzleId = data.id;

			const transform = complete.transform;
			const puzzleTransformed = complete.puzzleTransformed;
			const gridTransformed = complete.gridTransformed;

			const puzzleString = puzzleTransformed.join("");
			board.cells.fromString(puzzleString);
			board.puzzleSolved.set(gridTransformed);
			for (const cell of board.cells) {
				const startCell = board.startCells[cell.index];
				startCell.symbol = cell.symbol;
			}

			puzzleData.id = puzzleId;
			puzzleData.transform = transform;

			Undo.set(board);
			saveData();
			findAnimating = false;

			const messageClues = `Found a ${data.clueCount} clue Sudoku`;
			let messageNaked;
			if (data.nakedCount === 0) messageNaked = `, solvable using only Hidden Singles.`;
			else messageNaked = `, solvable using Singles, ${data.nakedCount} found only as Naked.`;

			if (foundPanel) foundPanel.hide();
			foundPanel = new Panel(messageClues + messageNaked);
			foundPanel.show();
		}
		draw();
	}
	requestAnimationFrame(animation);

	let findCount = 0;
	let findStartTime = performance.now();
	worker.onmessage = (e) => {
		const data = e.data;
		animator.add(data);
		findCount++;
		if (data.solved) {
			const time = performance.now() - findStartTime;
			console.log(`${findCount} tries in ${time / 1000}s`);
			console.log(`${findCount / time * 1000}/s`);
			console.log(`${time / findCount / 1000}s avg`);

			worker.terminate();
		}
	};
	const workerData = {};
	worker.postMessage(workerData);
}

const loadSudoku = () => {
	if (strategy === "level") {
		loadLevel();
		return;
	} else {
		if (strategy === 'hardcoded') return;
	}

	fetch("../sudokulib/sudoku.php?version=2&strategy=candidate_" + strategy).then(response => {
		response.json().then((json) => {
			const puzzleId = json.id;
			const puzzleDataHex = json.puzzleData;

			if (puzzleDataHex.length !== 64) return;
			const [puzzle, grid] = SudokuProcess.puzzleHexGrid(puzzleDataHex);

			const transform = generateTransform();
			const puzzleTransformed = generateFromSeed(puzzle, transform);
			const gridTransformed = generateFromSeed(grid, transform);

			const puzzleString = puzzleTransformed.join("");
			board.cells.fromString(puzzleString);
			board.puzzleSolved.set(gridTransformed);
			for (const cell of board.cells) {
				const startCell = board.startCells[cell.index];
				startCell.symbol = cell.symbol;
			}
			board.errorCells.clear();

			puzzleData.id = puzzleId;
			puzzleData.transform = transform;

			Undo.set(board);
			saveData();
			draw();
		});
	});
};

if (!loaded) loadSudoku();

title.style.fontFamily = 'sans-serif';
title.style.fontWeight = 'bold';
title.style.whiteSpace = 'nowrap';
title.style.textAlign = 'center';
title.style.position = 'absolute';
title.style.top = headerHeight / 2 + 'px';
title.style.left = '50%';
title.style.transform = 'translate(-50%, -50%)';
let titleString = null;
if (strategy === 'naked2') titleString = "Naked Pair";
if (strategy === 'naked3') titleString = "Naked Triple";
if (strategy === 'naked4') titleString = "Naked Quad";
if (strategy === 'hidden1') titleString = "Hidden Single";
if (strategy === 'hidden2') titleString = "Hidden Pair";
if (strategy === 'hidden3') titleString = "Hidden Triple";
if (strategy === 'hidden4') titleString = "Hidden Quad";
if (strategy === 'omissions') titleString = "Intersection Removal";
if (strategy === 'uniqueRectangle') titleString = "Deadly Pattern";
if (strategy === 'yWing') titleString = "Y Wing";
if (strategy === 'xyzWing') titleString = "XYZ Wing";
if (strategy === 'xWing') titleString = "X Wing";
if (strategy === 'swordfish') titleString = "Swordfish";
if (strategy === 'jellyfish') titleString = "Jellyfish";
if (titleString === null) titleString = "Singles";
if (strategy === 'level') {
	title.style.fontSize = (headerHeight * 0.75) + 'px';
	title.style.lineHeight = headerHeight + 'px';
	title.appendChild(document.createTextNode(titleString));
} else if (strategy !== 'hardcoded') {
	const scale = 0.6;
	title.style.fontSize = (headerHeight * 0.75 * scale) + 'px';
	title.style.lineHeight = (headerHeight * scale) + 'px';
	title.appendChild(document.createTextNode(titleString));
}

const applyUndo = (reverse) => {
	const selectedIndex = reverse ? Undo.redo(board) : Undo.undo(board);
	if (selectedIndex >= 0) {
		selected = true;
		selectedRow = Math.floor(selectedIndex / 9);
		selectedCol = selectedIndex % 9;
	} else {
		selected = false;
	}
	board.errorCells.clear();
	saveData();
	draw();
};
Menu.undoIcons.undo_on.addEventListener('click', () => { applyUndo(false) });
Menu.undoIcons.redo_on.addEventListener('click', () => { applyUndo(true) });
const preventDefault = event => { event.preventDefault() };
Menu.undoIcons.undo_on.addEventListener("dblclick", preventDefault);
Menu.undoIcons.redo_on.addEventListener('dblclick', preventDefault);
Menu.undoIcons.undo_off.addEventListener("dblclick", preventDefault);
Menu.undoIcons.redo_off.addEventListener('dblclick', preventDefault);

Menu.deleteButton.addEventListener('click', () => {
	if (!selected) return;

	const selectedIndex = selectedRow * 9 + selectedCol;
	const cell = board.cells[selectedIndex];
	if (cell.symbol === 0 && cell.mask === 0x0000) return;

	cell.symbol = 0;
	cell.mask = 0x0000;
	board.errorCells.delete(selectedIndex);
	Undo.add(board, selectedIndex);
	saveData();
	draw();
});

if (strategy !== 'hardcoded') {
	Menu.checkButton.style.display = "block";
	Menu.checkButton.addEventListener('click', () => {
		if (findAnimating) return;

		let errorCount = 0;
		let solved = true;
		board.errorCells.clear();
		for (let i = 0; i < 81; i++) {
			const cell = board.cells[i];
			if (cell.symbol === 0) {
				solved = false;
				continue;
			}
			if (cell.symbol !== board.puzzleSolved[i]) {
				board.errorCells.add(i);
				errorCount++;
				solved = false;
			}
		}
		saveData();
		draw();
		if (solved) {
			AlertPanel.alert("Puzzle Complete!!!");
		} else if (errorCount > 0) {
			if (errorCount === 1) AlertPanel.alert(errorCount + " Error!");
			else AlertPanel.alert(errorCount + " Errors!");
		} else {
			AlertPanel.alert("No Errors!");
		}
	});
}

if (levelMode) {
	Menu.infoButton.style.display = "block";
	Menu.infoButton.addEventListener('click', () => {
		if (!infoPanel) infoPanel = new FramePanel("./info.html");
		infoPanel.show();
	});
}

const fillButton = document.createElement('button');
fillButton.appendChild(document.createTextNode("Candidates"));
// fillButton.style.width = '48px';
fillButton.addEventListener('click', () => {
	for (const cell of board.cells) if (cell.symbol === 0 && cell.mask === 0x0000) cell.fill();
	candidates(board.cells);

	Undo.add(board, -1);
	draw();
	saveData();
});
const solveButton = document.createElement('button');
solveButton.appendChild(document.createTextNode("Fill"));
// solveButton.style.width = '48px';
solveButton.addEventListener('click', () => {
	for (const cell of board.cells) if (cell.symbol === 0 && cell.mask === 0x0000) cell.fill();
	const now = performance.now();
	const result = fillSolve(board.cells, null, []);
	console.log("----- " + (performance.now() - now) / 1000);
	for (const line of consoleOut(result)) console.log(line);

	Undo.add(board, -1);
	draw();
	saveData();
});
Menu.autoBar.appendChild(fillButton);
Menu.autoBar.appendChild(solveButton);
pickerContainer.appendChild(Menu.autoBar);

header.appendChild(title);

header.style.position = 'absolute';
header.style.top = '0%';
header.style.width = '100%';
header.style.left = '50%';
header.style.transform = 'translateX(-50%)';
header.style.height = headerHeight + 'px';
header.style.borderBottom = '1px solid black'
header.style.background = 'White'

mainBody.style.position = 'absolute';
mainBody.style.top = headerHeight + 'px';
mainBody.style.bottom = footerHeight + 'px';
mainBody.style.width = '100%';
mainBody.style.left = '50%';
mainBody.style.transform = 'translateX(-50%)';

document.body.style.userSelect = 'none';
document.body.style.margin = '0px';

pickerContainer.appendChild(picker);
pickerContainer.appendChild(pickerMarker);
pickerContainer.appendChild(Menu.pickerBar);
pickerContainer.appendChild(Menu.autoBar);

mainBody.appendChild(pickerContainer);
mainBody.appendChild(board.canvas);

document.body.appendChild(header);
document.body.appendChild(mainBody);

Menu.mainBar.style.top = "0%";
Menu.mainBar.style.left = "0%";
Menu.mainBar.style.paddingLeft = "8px";
document.body.appendChild(Menu.mainBar);

Menu.toolBar.style.top = "0%";
Menu.toolBar.style.right = "0%";
Menu.toolBar.style.paddingRight = "8px";
document.body.appendChild(Menu.toolBar);

const mainBodySize = () => {
	const width = window.innerWidth;
	const height = window.innerHeight - headerHeight - footerHeight;
	return { width, height };
};

const sizeMenu = () => {
	if (!Menu.backing.parentElement) return;
	const boundingClientRect = mainBodySize();
	const maxPoint = boundingClientRect.top + boundingClientRect.height;
	const menuClientRect = Menu.backing.getBoundingClientRect();
	const maxHeight = maxPoint - menuClientRect.top;
	Menu.backing.style.maxHeight = maxHeight + footerHeight + "px";
}

Menu.menu.addEventListener('click', () => {
	if (Menu.backing.parentElement) {
		Menu.backing.parentElement.removeChild(Menu.backing);
		return;
	}
	mainBody.appendChild(Menu.backing);
	sizeMenu();
});

document.body.addEventListener('click', (event) => {
	if (!Menu.backing.parentElement) return;
	let parent = event.target;
	while (parent) {
		if (parent === Menu.menu) return;
		if (parent === Menu.backing) return;
		parent = parent.parentElement;
	}
	Menu.backing.parentElement.removeChild(Menu.backing);
});

if (strategy !== 'hardcoded') {
	Menu.newPuzzle.style.display = "block";
	Menu.newPuzzle.addEventListener('click', () => {
		if (findAnimating) return;

		const name = levelMode ? titleString : Menu.menuTitle(strategy);
		const message = "Do you want to find a new " + name + " puzzle?";
		AlertPanel.confirm(message, confirmed => {
			if (!confirmed) return;

			if (foundPanel) {
				foundPanel.hide();
				foundPanel = null;
			}

			selected = false;
			loadSudoku();
		});
	});
}

Menu.reset.addEventListener('click', () => {
	if (findAnimating) return;

	const name = levelMode ? titleString : Menu.menuTitle(strategy);
	const message = "Do you want to restart this " + name + " puzzle?";
	AlertPanel.confirm(message, confirmed => {
		if (!confirmed) return;

		selected = false;
		board.resetGrid();
		Undo.set(board);
		saveData();
		draw();
	});
});

const resize = () => {
	const boundingClientRect = mainBodySize();

	const width = boundingClientRect.width;
	const height = boundingClientRect.height;

	const portraitWidth = width;
	const portraitHeight = height - PICKER.cellsSize - spacing * 1;
	const portraitSize = Math.min(portraitWidth, portraitHeight);

	const landscapeWidth = width - PICKER.cellsSize - spacing * 3;
	const landscapeHeight = height;
	const landscapeSize = Math.min(landscapeWidth, landscapeHeight);

	const boxSize = Math.max(portraitSize, landscapeSize);
	if (landscapeSize > portraitSize) {
		const buffer = (landscapeWidth > landscapeSize) ? (landscapeWidth - landscapeSize) / 2 : 0;

		board.canvas.style.top = '50%';
		board.canvas.style.left = spacing + buffer + 'px';
		board.canvas.style.transform = 'translate(0%, -50%)';

		pickerContainer.style.top = '50%';
		pickerContainer.style.left = width - (spacing + buffer) + 'px';
		pickerContainer.style.transform = 'translate(-100%, -50%)';

		Menu.pickerBar.style.top = '100%';
		Menu.pickerBar.style.margin = '8px 0px 0px 0px';
		Menu.pickerBar.style.left = '50%';
		Menu.pickerBar.style.transform = 'translate(-50%, 0%)';
		Menu.pickerBarLandscape(true);

		Menu.autoBar.style.bottom = '100%';
		Menu.autoBar.style.margin = '0px 0px 16px 0px';
		Menu.autoBar.style.right = '50%';
		Menu.autoBar.style.transform = 'translate(50%, 0%)';
		Menu.autoBarLandscape(true);

		Menu.autoBar.style.gap = '16px';
	} else {
		const buffer = (portraitHeight > portraitSize) ? (portraitHeight - portraitSize) / 2 : 0;

		board.canvas.style.top = buffer + 'px';
		board.canvas.style.left = '50%';
		board.canvas.style.transform = 'translate(-50%, 0%)';

		pickerContainer.style.top = height - buffer + 'px';
		pickerContainer.style.left = '50%';
		pickerContainer.style.transform = 'translate(-50%, -100%)';

		Menu.pickerBar.style.top = '50%';
		Menu.pickerBar.style.margin = '0px 0px 0px 8px';
		Menu.pickerBar.style.left = '100%';
		Menu.pickerBar.style.transform = 'translate(0%, -50%)';
		Menu.pickerBarLandscape(false);

		Menu.autoBar.style.bottom = '50%';
		Menu.autoBar.style.margin = '0px 16px 0px 0px';
		Menu.autoBar.style.right = '100%';
		Menu.autoBar.style.transform = 'translate(0%, 50%)';
		Menu.autoBarLandscape(false);

		Menu.autoBar.style.gap = '16px';
	}

	board.canvas.style.width = boxSize + 'px';
	board.canvas.style.height = boxSize + 'px';
	board.canvas.width = Math.floor(boxSize * window.devicePixelRatio / 1) * 2;
	board.canvas.height = Math.floor(boxSize * window.devicePixelRatio / 1) * 2;

	sizeMenu();
	draw();
};

resize();
window.addEventListener('resize', resize);

/* if (strategy === 'hardcoded') {
	superimposeCandidates = (reset = false) => {
		if (timer) {
			window.clearInterval(timer);
			board.cells.fromData(startBoard);
			draw();
			timer = 0;
			if (!reset) return;
		}
		if (!selected && superpositionMode === 0) return;

		startBoard = board.cells.toData();

		let flips;
		if (superpositionMode === 0) {
			const union = new Grid();
			for (let i = 0; i < 81; i++) union[i] = new CellCandidate(i);
			for (let index = 0; index < 81; index++) {
				const startCell = startBoard[index];
				const unionCell = union[index];
				if (startCell.symbol !== 0) unionCell.setSymbol(startCell.symbol);
			}

			const superCell = board.cells[selectedRow * 9 + selectedCol];
			if (superCell.symbol !== 0) return;

			const supers = [];

			for (let x = 1; x <= 9; x++) {
				if (superCell.has(x)) {
					// cell.delete(x);
					superCell.setSymbol(x);
					fillSolve(board.cells, null, []);
					supers.push(board.cells.toData());
					board.cells.fromData(startBoard);
				}
			}

			if (supers.length < 2) return;

			for (let index = 0; index < 81; index++) {
				const unionCell = union[index];
				if (unionCell.symbol !== 0) continue;

				for (const solution of supers) {
					const solutionCell = solution[index];
					if (solutionCell.symbol === 0) {
						for (let x = 1; x <= 9; x++) {
							if (((solutionCell.mask >>> x) & 0x0001) === 0x0001) {
								unionCell.add(x)
							}
						}
					} else {
						unionCell.add(solutionCell.symbol)
					}
				}
			}

			flips = [startBoard, union.toData()];
		} else {
			const intersectionFromUnion = (intersection, union) => {
				for (let index = 0; index < 81; index++) {
					const unionCell = union[index];
					const intersectionCell = intersection[index];
					if (unionCell.symbol === 0) {
						for (let x = 1; x <= 9; x++) {
							if (!unionCell.has(x)) {
								intersectionCell.delete(x);
							}
						}
					} else {
						// intersectionCell.setSymbol(unionCell.symbol);
					}
				}
			};

			const intersection = new Grid();
			for (let i = 0; i < 81; i++) intersection[i] = new CellCandidate(i);
			for (let index = 0; index < 81; index++) {
				const startCell = startBoard[index];
				const intersectionCell = intersection[index];
				intersectionCell.setSymbol(startCell.symbol);
				if (startCell.symbol === 0) intersectionCell.fill();
			}

			const solve = () => {
				if (superpositionMode === 1) fillSolve(board.cells, null, []);
				else fillSolve(board.cells, null, null);
			}

			// Candidates
			for (let index = 0; index < 81; index++) {
				const cell = board.cells[index];
				if (cell.symbol !== 0) continue;

				const union = new Grid();
				for (let i = 0; i < 81; i++) union[i] = new CellCandidate(i);
				for (let index = 0; index < 81; index++) {
					const startCell = startBoard[index];
					const unionCell = union[index];
					unionCell.setSymbol(startCell.symbol);
				}

				const supers = [];
				for (let x = 1; x <= 9; x++) {
					if (!cell.has(x)) continue;

					cell.setSymbol(x);
					solve();
					supers.push(board.cells.toData());
					board.cells.fromData(startBoard);
				}
				if (supers.length < 2) continue;

				for (let index = 0; index < 81; index++) {
					const unionCell = union[index];
					if (unionCell.symbol !== 0) continue;

					for (const solution of supers) {
						const solutionCell = solution[index];
						if (solutionCell.symbol === 0) {
							for (let x = 1; x <= 9; x++) {
								if (((solutionCell.mask >>> x) & 0x0001) === 0x0001) {
									unionCell.add(x)
								}
							}
						} else {
							unionCell.add(solutionCell.symbol)
						}
					}
				}
				intersectionFromUnion(intersection, union);
			}

			// Symbols
			for (const group of Grid.groupTypes) {
				for (let x = 1; x <= 9; x++) {
					const union = new Grid();
					for (let i = 0; i < 81; i++) union[i] = new CellCandidate(i);
					for (let index = 0; index < 81; index++) {
						const startCell = startBoard[index];
						const unionCell = union[index];
						unionCell.setSymbol(startCell.symbol);
					}

					const supers = [];
					for (const index of group) {
						const cell = board.cells[index];
						if (cell.symbol !== 0) continue;
						if (!cell.has(x)) continue;

						cell.setSymbol(x);
						solve();
						supers.push(board.cells.toData());
						board.cells.fromData(startBoard);
					}

					if (supers.length < 2) continue;

					for (let index = 0; index < 81; index++) {
						const unionCell = union[index];
						if (unionCell.symbol !== 0) continue;

						for (const solution of supers) {
							const solutionCell = solution[index];
							if (solutionCell.symbol === 0) {
								for (let x = 1; x <= 9; x++) {
									if (((solutionCell.mask >>> x) & 0x0001) === 0x0001) {
										unionCell.add(x)
									}
								}
							} else {
								unionCell.add(solutionCell.symbol)
							}
						}
					}
					intersectionFromUnion(intersection, union);
				}
			}
			flips = [startBoard, intersection.toData()];
		}

		let iteration = 0;
		timer = window.setInterval(() => {
			board.cells.fromData(flips[iteration % flips.length]);
			draw();
			board.cells.fromData(startBoard);
			iteration++;
		}, 1000 * 0.1);
	}

	let startBoard = null;
	const superpositionCellButton = document.createElement('button');
	superpositionCellButton.appendChild(document.createTextNode("C"));
	superpositionCellButton.style.position = 'absolute';
	superpositionCellButton.style.top = headerHeight / 2 + 'px';
	superpositionCellButton.style.transform = 'translateY(-50%)';
	superpositionCellButton.style.right = '120px';
	superpositionCellButton.addEventListener('click', () => {
		superpositionMode = 0;
		for (const cell of board.cells) if (cell.symbol === 0 && cell.mask === 0x0000) cell.fill();
		candidates(board.cells);
		superimposeCandidates();
	});
	header.appendChild(superpositionCellButton);

	const superpositionAllCellSymbolButton = document.createElement('button');
	superpositionAllCellSymbolButton.appendChild(document.createTextNode("S"));
	superpositionAllCellSymbolButton.style.position = 'absolute';
	superpositionAllCellSymbolButton.style.top = headerHeight / 2 + 'px';
	superpositionAllCellSymbolButton.style.transform = 'translateY(-50%)';
	superpositionAllCellSymbolButton.style.right = '92px';
	superpositionAllCellSymbolButton.addEventListener('click', () => {
		superpositionMode = 1;
		for (const cell of board.cells) if (cell.symbol === 0 && cell.mask === 0x0000) cell.fill();
		candidates(board.cells);
		superimposeCandidates();
	});
	header.appendChild(superpositionAllCellSymbolButton);

	const superpositionAllFullSolveButton = document.createElement('button');
	superpositionAllFullSolveButton.appendChild(document.createTextNode("A")); // ALL Candidate and Symbol full solve
	superpositionAllFullSolveButton.style.position = 'absolute';
	superpositionAllFullSolveButton.style.top = headerHeight / 2 + 'px';
	superpositionAllFullSolveButton.style.right = '64px';
	superpositionAllFullSolveButton.style.transform = 'translateY(-50%)';
	superpositionAllFullSolveButton.addEventListener('click', () => {
		superpositionMode = 2;
		for (const cell of board.cells) if (cell.symbol === 0 && cell.mask === 0x0000) cell.fill();
		candidates(board.cells);
		superimposeCandidates();
	});
	header.appendChild(superpositionAllFullSolveButton);
}
*/
