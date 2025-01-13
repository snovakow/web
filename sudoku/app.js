import { FONT, board, loadGrid, saveGrid, setMarkerFont } from "../sudokulib/board.js";
import { generateFromSeed, generateTransform, fillSolve, consoleOut } from "../sudokulib/generator.js";
import { CellCandidate, Grid } from "../sudokulib/Grid.js";
import * as PICKER from "../sudokulib/picker.js";
import { candidates } from "../sudokulib/solver.js";
import * as Menu from "./menu.js";
import * as SudokuProcess from "../sudokulib/process.js";

const picker = PICKER.picker;
const pickerDraw = PICKER.pickerDraw;
const pickerMarker = PICKER.pickerMarker;
const pixAlign = PICKER.pixAlign;

const searchParams = new URLSearchParams(window.location.search);
const strategy = searchParams.get("strategy");
const tableNames = [
	"simple_hidden",
	"simple_omission",
	"candidate_visible",
	"candidate_naked2",
	"candidate_naked3",
	"candidate_naked4",
	"candidate_hidden1",
	"candidate_hidden2",
	"candidate_hidden3",
	"candidate_hidden4",
	"candidate_omissions",
	"candidate_uniqueRectangle",
	"candidate_yWing",
	"candidate_xyzWing",
	"candidate_xWing",
	"candidate_swordfish",
	"candidate_jellyfish",
	"super_min",
	"super_max",
	"custom",
	"hardcoded",
];
let search = "?strategy=" + tableNames[0];
for (const tableName of tableNames) {
	if (strategy === tableName) {
		search = null;
		break;
	}
}
if (search !== null) window.location.search = search;

const puzzleData = {
	id: null,
	strategy: null,
	transform: null,
	grid: new Uint8Array(81),
	markers: new Uint16Array(81),
}
Object.seal(puzzleData);

let markerFont = false;
let pickerMarkerMode = false;

const headerHeight = Menu.headerHeight;
const footerHeight = 8;

let selectedRow = 0;
let selectedCol = 0;
let selected = false;

const saveData = () => {
	saveGrid({
		id: puzzleData.id,
		strategy: strategy,
		transform: puzzleData.transform,
		grid: puzzleData.grid.join(""),
		markers: puzzleData.markers.join(""),
		markerFont,
		pickerMarkerMode,
		selected,
		selectedRow,
		selectedCol
	});
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

	if (FONT.initialized) {
		const font = pixAlign(PICKER.cellSize * window.devicePixelRatio) + "px " + FONT.marker;
		const fontMarker = pixAlign(PICKER.cellSize * 3 / 8 * window.devicePixelRatio) + "px " + FONT.marker;
		pickerDraw(selectedSet, font, fontMarker);
	} else {
		pickerDraw(selectedSet);
	}
}

{
	const urlComicSans = 'url(../snovakow/assets/fonts/comic-sans-ms/COMIC.TTF)';
	const urlOpenSansRegular = 'url(../snovakow/assets/fonts/Open_Sans/static/OpenSans-Regular.ttf)';

	const fontOpenSansRegular = new FontFace("REGULAR", urlOpenSansRegular);
	const fontComicSans = new FontFace("COMIC", urlComicSans);

	document.fonts.add(fontOpenSansRegular);
	document.fonts.add(fontComicSans);

	fontOpenSansRegular.load();
	fontComicSans.load();

	document.fonts.ready.then(() => {
		FONT.initialized = true;
		draw();
	});
}

let timer = 0;
let superpositionMode = 0;
let superimposeCandidates = null;

const click = (event) => {
	// event.preventDefault();

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

const pickerClick = (event) => {
	// event.preventDefault();

	if (!selected) return;

	const running = timer ? true : false;
	if (timer && superimposeCandidates) superimposeCandidates(false);

	const [r, c] = clickLocation(event);

	const index = r * 3 + c + 1;
	const selectedIndex = selectedRow * 9 + selectedCol;
	const symbol = board.cells[selectedIndex].symbol;

	if (index === symbol) return;
	board.cells[selectedIndex].setSymbol(index);
	// if (symbol === index) {
	// 	const cell = board.cells[selectedIndex];
	// 	cell.setSymbol(0);
	// } else {
	// 	board.cells[selectedIndex].setSymbol(index);
	// }

	saveData();
	draw();

	if (running) {
		fillSolve(board.cells, null, null, []);
		saveData();
		if (superimposeCandidates) superimposeCandidates();
	}
};
picker.addEventListener('click', pickerClick);

const pickerMarkerClick = (event) => {
	// event.preventDefault();

	if (!selected) return;

	const running = timer ? true : false;
	if (timer) superimposeCandidates(false);

	const [r, c] = clickLocation(event);

	const symbol = r * 3 + c + 1;
	const selectedIndex = selectedRow * 9 + selectedCol;
	const cell = board.cells[selectedIndex];
	if (cell.symbol === 0) {
		const had = cell.delete(symbol);
		if (!had) cell.add(symbol);
	} else {
		cell.setSymbol(0);
		cell.add(symbol);
	}

	saveData();
	draw();

	if (running) {
		fillSolve(board.cells, null, null, []);
		saveData();
		if (superimposeCandidates) superimposeCandidates();
	}
};
pickerMarker.addEventListener('click', pickerMarkerClick);

const onFocus = () => {
	// console.log("onFocus");
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
board.canvas.style.left = '50%';
board.canvas.style.touchAction = "manipulation";
picker.style.touchAction = "manipulation";
pickerMarker.style.touchAction = "manipulation";

const header = document.createElement('DIV');
const mainBody = document.createElement('DIV');

const fontCheckbox = document.createElement('input');
fontCheckbox.type = "checkbox";
fontCheckbox.name = "name";
fontCheckbox.value = "value";
fontCheckbox.id = "id";
fontCheckbox.style.position = 'absolute';
fontCheckbox.style.bottom = 0 + 'px';
fontCheckbox.style.left = 0 + 'px';
// fontCheckbox.style.transform = 'translate(0%, 100%)';
// fontCheckbox.style.margin = '0px';
// fontCheckbox.style.padding = '8px';
fontCheckbox.addEventListener('change', () => {
	markerFont = fontCheckbox.checked;
	setMarkerFont(markerFont);
	saveData();
	draw();
});

const fontLabel = document.createElement('label')
fontLabel.appendChild(document.createTextNode('Marker Font'));
fontLabel.style.position = 'absolute';
fontLabel.style.top = 0 + 'px';
fontLabel.style.right = 0 + 'px';
fontLabel.style.paddingLeft = 24 + 'px';
fontLabel.style.paddingTop = 8 + 'px';
fontLabel.style.paddingRight = 8 + 'px';
fontLabel.style.whiteSpace = 'nowrap';
fontLabel.for = "id";
fontLabel.appendChild(fontCheckbox);

let loaded = false;
if (window.name) {
	const metadata = loadGrid();
	if (metadata) {
		if (metadata.strategy === strategy) {
			if (metadata.selected !== undefined) selected = metadata.selected;
			if (metadata.selectedRow !== undefined) selectedRow = metadata.selectedRow;
			if (metadata.selectedCol !== undefined) selectedCol = metadata.selectedCol;

			if (metadata.id !== undefined) puzzleData.id = metadata.id;
			if (metadata.transform !== undefined) puzzleData.transform = metadata.transform;
			if (metadata.grid !== undefined) puzzleData.grid.set(metadata.grid);

			loaded = true;
		}

		if (metadata.markerFont !== undefined) markerFont = metadata.markerFont;
		setMarkerFont(markerFont);
		fontCheckbox.checked = markerFont;

		if (metadata.pickerMarkerMode !== undefined) pickerMarkerMode = metadata.pickerMarkerMode;

		if (metadata.strategy !== strategy) {
			metadata.strategy = strategy;
			saveData();
		}
		Menu.setMenuItem(strategy);
	}
	draw();
}

Menu.setMenuReponse((responseStrategy, responseTitle) => {
	if (strategy === responseStrategy) return false;
	if (!window.confirm("Do you want to start a new " + responseTitle + " puzzle?")) return false;
	window.location.search = "?strategy=" + responseStrategy;
	return true;
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
if (strategy === 'custom' || strategy === 'hardcoded') {
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

				if (strategy === 'custom') {
					if (puzzleData.length !== 64) return;
					const [puzzle, grid] = SudokuProcess.puzzleHexGrid(puzzleData);
					puzzleData = puzzle;
				}
				if (strategy === 'hardcoded') {
					if (puzzleData.length !== 81) return;
				}
				entries.push({ id, title, puzzleData });

				names.push(title);
			}

			customSelector = createSelect(["-", ...names], (select) => {
				selected = false;

				if (select.selectedIndex === 0) {
					for (const cell of board.cells) {
						cell.symbol = 0;
						cell.mask = 0x0000;
					}
					for (const cell of board.startCells) cell.symbol = 0;

					puzzleData.id = "";
					puzzleData.grid.fill(0);
					puzzleData.markers.fill(0);
				} else {
					const index = select.selectedIndex - 1;
					const entry = entries[index];
					board.setGrid(entry.puzzleData);

					const grid = new Uint8Array(81);
					const markers = new Uint16Array(81);
					for (let i = 0; i < 81; i++) {
						grid[i] = board.cells[i].symbol;
						markers[i] = board.cells[i].mask;
					}

					puzzleData.id = entry.id;
					puzzleData.grid = grid;
					puzzleData.markers = markers;
				}
				puzzleData.transform = null;

				saveData();
				draw();
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

const loadSudoku = () => {
	fetch("../sudokulib/sudoku.php?version=2&strategy=" + strategy).then(response => {
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
			for (const cell of board.cells) {
				const startCell = board.startCells[cell.index];
				startCell.symbol = cell.symbol;
			}

			puzzleData.id = puzzleId;
			puzzleData.transform = transform;
			puzzleData.grid = gridTransformed;

			saveData();
			draw();
		});
	});
};

if (!loaded && strategy !== 'custom' && strategy !== 'hardcoded') {
	loadSudoku();
}

title.style.fontSize = (headerHeight - 6) + 'px';
title.style.fontWeight = 'bold';
title.style.lineHeight = headerHeight + 'px';
title.style.textAlign = 'center';
title.style.position = 'absolute';
title.style.top = headerHeight / 2 + 'px';
title.style.left = '50%';
title.style.transform = 'translate(-50%, -50%)';
let titleString = null;
if (strategy === 'simple_hidden') titleString = "Hidden Single";
if (strategy === 'simple_omission') titleString = "Intersection Removal";
if (strategy === 'candidate_visible') titleString = "Basic Candidtates";
if (strategy === 'candidate_naked2') titleString = "Naked Pair";
if (strategy === 'candidate_naked3') titleString = "Naked Triple";
if (strategy === 'candidate_naked4') titleString = "Naked Quad";
if (strategy === 'candidate_hidden1') titleString = "Hidden Single";
if (strategy === 'candidate_hidden2') titleString = "Hidden Pair";
if (strategy === 'candidate_hidden3') titleString = "Hidden Triple";
if (strategy === 'candidate_hidden4') titleString = "Hidden Quad";
if (strategy === 'candidate_omissions') titleString = "Intersection Removal";
if (strategy === 'candidate_uniqueRectangle') titleString = "Deadly Pattern";
if (strategy === 'candidate_yWing') titleString = "Y Wing";
if (strategy === 'candidate_xyzWing') titleString = "XYZ Wing";
if (strategy === 'candidate_xWing') titleString = "X Wing";
if (strategy === 'candidate_swordfish') titleString = "Swordfish";
if (strategy === 'candidate_jellyfish') titleString = "Jellyfish";
if (strategy === 'super_min') titleString = "Other Strategies";
if (strategy === 'super_max') titleString = "Difficult";
if (titleString) title.appendChild(document.createTextNode(titleString));

Menu.markerButton.addEventListener('click', () => {
	pickerMarkerMode = !pickerMarkerMode;
	setMarkerMode();
	saveData();
	draw();
});
Menu.deleteButton.addEventListener('click', () => {
	if (!selected) return;

	const cell = board.cells[selectedRow * 9 + selectedCol];
	cell.symbol = 0;
	cell.mask = 0x0000;
	saveData();
	draw();
});

const fillButton = document.createElement('button');
fillButton.appendChild(document.createTextNode("Mark"));
fillButton.style.width = '48px';
fillButton.addEventListener('click', () => {
	for (const cell of board.cells) if (cell.symbol === 0 && cell.mask === 0x0000) cell.fill();
	candidates(board.cells);

	draw();
	saveData();
});
const solveButton = document.createElement('button');
solveButton.appendChild(document.createTextNode("Fill"));
solveButton.style.width = '48px';
solveButton.addEventListener('click', () => {
	for (const cell of board.cells) if (cell.symbol === 0 && cell.mask === 0x0000) cell.fill();
	const now = performance.now();
	const result = fillSolve(board.cells, null, null, []);
	console.log("----- " + (performance.now() - now) / 1000);
	for (const line of consoleOut(result)) console.log(line);

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

const sizeMenu = () => {
	if (!Menu.backing.parentElement) return;
	const boundingClientRect = mainBody.getBoundingClientRect();
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

if (strategy === 'custom') {
	Menu.newPuzzle.style.display = 'none';
} else {
	Menu.newPuzzle.addEventListener('click', () => {
		if (!window.confirm("Do you want to start a new puzzle?")) return;
		selected = false;
		loadSudoku();
	});
}

Menu.reset.addEventListener('click', () => {
	if (!window.confirm("Do you want to restart the puzzle?")) return;
	selected = false;
	board.resetGrid();
	saveData();
	draw();
});

Menu.settings.addEventListener('click', () => {
	if (fontLabel.parentElement) fontLabel.parentElement.removeChild(fontLabel);
	else mainBody.appendChild(fontLabel);
});

const resize = () => {
	const boundingClientRect = mainBody.getBoundingClientRect();

	const width = boundingClientRect.width;
	const height = boundingClientRect.height;

	const padding = 8;

	const landscapeWidth = width - PICKER.cellsSize - padding * 3;
	const landscapeHeight = height;
	const landscapeSize = Math.min(landscapeWidth, landscapeHeight);

	const portraitWidth = width;
	const portraitHeight = height - PICKER.cellsSize - padding * 1;
	const portraitSize = Math.min(portraitWidth, portraitHeight);

	let boxSize;
	if (landscapeSize > portraitSize) {
		boxSize = landscapeSize;

		let inset = padding;
		if (boxSize < landscapeWidth) {
			inset += Math.floor((landscapeWidth - boxSize) / 2);
		}

		board.canvas.style.top = '50%';
		board.canvas.style.left = inset + 'px';
		board.canvas.style.transform = 'translate(0%, -50%)';

		pickerContainer.style.bottom = '50%';
		pickerContainer.style.right = padding + 'px';
		pickerContainer.style.transform = 'translate(0, 50%)';

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
		boxSize = portraitSize;

		let inset = 0;
		if (boxSize < portraitHeight) {
			inset += Math.floor((portraitHeight - boxSize) / 2);
		}

		board.canvas.style.top = inset + 'px';
		board.canvas.style.left = '50%';
		board.canvas.style.transform = 'translate(-50%, 0%)';

		pickerContainer.style.bottom = 0 + 'px';
		pickerContainer.style.right = '50%';
		pickerContainer.style.transform = 'translate(50%, 0%)';

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

if (strategy === 'custom') {
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
					fillSolve(board.cells, null, null, []);
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
				if (superpositionMode === 1) fillSolve(board.cells, null, null, []);
				else fillSolve(board.cells, null, null, null);
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
