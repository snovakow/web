import { FONT, board, loadGrid, saveGrid } from "../sudokulib/board.js";
import { generateFromSeed, generateTransform, fillSolve, consoleOut } from "../sudokulib/generator.js";
import { CellCandidate, Grid } from "../sudokulib/Grid.js";
import * as PICKER from "../sudokulib/picker.js";
import { candidates } from "../sudokulib/solver.js";
import * as Menu from "./menu.js";
import * as Undo from "./undo.js";
import * as SudokuProcess from "../sudokulib/process.js";

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
		"custom",
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
	grid: new Uint8Array(81),
	markers: new Uint16Array(81),
}
Object.seal(puzzleData);

let pickerMarkerMode = false;

const headerHeight = Menu.headerHeight;
const footerHeight = 16;

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
		pickerMarkerMode,
		selected,
		selectedRow,
		selectedCol,
		undo: Undo.saveData()
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

const pickerClick = (event) => {
	// event.preventDefault();

	if (!selected) return;

	const running = timer ? true : false;
	if (timer && superimposeCandidates) superimposeCandidates(false);

	const [r, c] = clickLocation(event);

	const index = r * 3 + c + 1;
	const selectedIndex = selectedRow * 9 + selectedCol;
	const symbol = board.cells[selectedIndex].symbol;

	// if (index === symbol) return;
	// board.cells[selectedIndex].setSymbol(index);
	const cell = board.cells[selectedIndex];
	if (symbol === index) cell.setSymbol(0);
	else cell.setSymbol(index);
	board.errorCells.delete(selectedIndex);

	Undo.add(board, selectedIndex);
	saveData();
	draw();

	if (running) {
		fillSolve(board.cells, null, []);
		saveData();
		if (superimposeCandidates) superimposeCandidates();
	}

	if (puzzleFinished()) {
		window.setTimeout(() => {
			alert("Puzzle Complete!!!");
		}, 0);
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
	board.errorCells.delete(selectedIndex);

	Undo.add(board, selectedIndex);

	saveData();
	draw();

	if (running) {
		fillSolve(board.cells, null, []);
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

let loaded = false;
const loadGridMetadata = loadGrid();
if (loadGridMetadata) {
	const metadata = loadGridMetadata;
	if (metadata.strategy === strategy) {
		if (metadata.selected !== undefined) selected = metadata.selected;
		if (metadata.selectedRow !== undefined) selectedRow = metadata.selectedRow;
		if (metadata.selectedCol !== undefined) selectedCol = metadata.selectedCol;

		if (metadata.id !== undefined) puzzleData.id = metadata.id;
		if (metadata.transform !== undefined) puzzleData.transform = metadata.transform;
		if (metadata.grid !== undefined) puzzleData.grid.set(metadata.grid);

		loaded = true;
	}

	if (metadata.pickerMarkerMode !== undefined) pickerMarkerMode = metadata.pickerMarkerMode;

	if (metadata.strategy !== strategy) {
		metadata.strategy = strategy;
		saveData();
	}
	if (!levelMode) Menu.setMenuItem(strategy);

	Undo.loadData(metadata.undo);
	draw();
}

Menu.setMenuReponse((responseStrategy) => {
	if (strategy === responseStrategy) return false;
	if (!window.confirm("Do you want to start a " + Menu.menuTitle(responseStrategy) + " puzzle?")) return false;
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
				board.puzzleSolved.fill(0);
				board.errorCells.clear();

				Undo.set(board);
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

let findAnimating = false;
const loadLevel = () => {
	const TICK_RATE = 30 / 1000;

	class AnimatorCell {
		constructor(index, symbol) {
			this.index = index;
			this.symbol = symbol;
		}
	}

	class Transformer {
		constructor(data) {
			this.data = data;
			this.transform = null;
			this.puzzleTransformed = null;
			this.gridTransformed = null;
			this.transformCount = 0;
		}
		process() {
			this.transform = generateTransform();
			this.puzzleTransformed = generateFromSeed(this.data.puzzleClues, this.transform);
			this.gridTransformed = generateFromSeed(this.data.puzzleFilled, this.transform);
			this.transformCount++;
		}
	}

	const randomize = (order) => {
		const size = order.length;
		for (let i = 0; i < size; i++) {
			const position = Math.floor(Math.random() * size);
			if (position !== i) {
				const tmp = order[position];
				order[position] = order[i];
				order[i] = tmp;
			}
		}
	}
	const randomArray = (size) => {
		const order = new Uint8Array(size);
		for (let i = 0; i < 81; i++) order[i] = i;
		return order;
	}
	const randomOrder = () => {
		const order = randomArray(81);
		randomize(order);
		return order;
	}

	const makeRandomClues = () => {
		// 19 - 31
		const spread = [
			3,
			1044,
			47049,
			677111,
			3393135,
			6786366,
			5920346,
			2438751,
			503206,
			55241,
			3333,
			143,
			1,
		];
		let total = 0;
		for (const amount of spread) total += amount;
		const random = Math.random() * total;
		let runningTotal = 0;
		let clueCount = 81;
		for (let i = 0; i < spread.length; i++) {
			const amount = spread[i];
			runningTotal += amount;
			if (random < runningTotal) {
				clueCount = i + 19;
				break;
			}
		}

		const randomGrid = new Uint8Array(81);
		const order = randomOrder();
		const rndx = randomArray(9);

		let filled = 0;
		for (let i = 0; i < 81; i++) {
			const index = order[i];
			randomize(rndx);
			for (let x = 0; x < 9; x++) {
				const symbol = rndx[x] + 1;

				let valid = true;
				const row = Math.floor(index / 9);
				const col = index % 9;
				const boxRow = 3 * Math.floor(row / 3);
				const boxCol = 3 * Math.floor(col / 3);
				for (let j = 0; j < 9; j++) {
					if (randomGrid[row * 9 + j] === symbol || randomGrid[j * 9 + col] === symbol) {
						valid = false;
						break;
					}
					const m = boxRow + Math.floor(j / 3);
					const n = boxCol + j % 3;
					if (randomGrid[m * 9 + n] === symbol) {
						valid = false;
						break;
					}
				}

				if (valid) {
					randomGrid[index] = symbol;
					filled++;
					break;
				}
			}
			if (filled === clueCount) break;
		}
		return randomGrid;
	}

	class Animator {
		constructor() {
			this.steps = [];
			this.stageRepeat = [];
			this.solved = null;
			this.startTime = 0;
			this.processedIndex = -1;
			this.addTransform();
		}
		addSteps(cells) {
			const random = randomOrder();
			for (let i = 0; i < 81; i++) {
				const index = random[i];
				const cell = board.cells[index];
				const symbol = cells[index];
				if (cell.symbol !== symbol || cell.mask !== 0x0000) this.steps.push(new AnimatorCell(index, symbol));
			}
		}
		addTransform() {
			if (this.stageRepeat.length === 0) {
				const randomClues = makeRandomClues();
				this.addSteps(randomClues);
			} else {
				let min = -1;
				let minIndex = -1;
				for (let i = 0; i < this.stageRepeat.length; i++) {
					const stage = this.stageRepeat[i];
					if (min === -1 || stage.transformCount < min) {
						min = stage.transformCount;
						minIndex = i;
					}
				}
				const stage = this.stageRepeat[minIndex];
				stage.process();
				this.addSteps(stage.puzzleTransformed);
			}
		}
		add(data) {
			if (this.stageRepeat.length === 0 || data.solved) {
				this.steps.splice(this.processedIndex + 1);
			}
			if (data.solved) {
				this.solved = new Transformer(data);
				this.solved.process();

				this.addSteps(this.solved.puzzleTransformed);
			} else {
				this.stageRepeat.push(new Transformer(data));
			}
		}
		update(timestamp) {
			if (this.startTime === 0) this.startTime = timestamp;

			const currentPoint = (timestamp - this.startTime) * TICK_RATE;
			const currentIndex = Math.floor(currentPoint);

			if (!this.solved) {
				if (currentIndex >= this.steps.length) this.addTransform();

				const diff = currentIndex - (this.steps.length - 1);
				if (diff > 0) this.startTime += diff / TICK_RATE;
			}

			const currentIndexMin = Math.min(currentIndex, this.steps.length - 1);
			for (let i = this.processedIndex + 1; i <= currentIndexMin; i++) {
				const step = this.steps[i];
				const cell = board.cells[step.index];
				cell.symbol = step.symbol;
				cell.mask = 0x0000;
			}
			this.processedIndex = currentIndexMin;

			if (this.solved && (this.processedIndex === this.steps.length - 1)) return this.solved;
			return null;
		}
	}

	const worker = new Worker("finder.js", { type: "module" });
	const animator = new Animator();
	findAnimating = true;

	let tickMark = -1;

	board.errorCells.clear();
	Undo.clear();
	selected = false;

	const animation = (timestamp) => {
		const animationId = requestAnimationFrame(animation);

		const tick = Math.floor(timestamp / TICK_RATE);
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
			puzzleData.grid = gridTransformed;
			puzzleData.markers.fill(0);

			Undo.set(board);
			saveData();
			findAnimating = false;
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
		if (strategy === 'custom' || strategy === 'hardcoded') return;
	}

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
			board.puzzleSolved.set(gridTransformed);
			for (const cell of board.cells) {
				const startCell = board.startCells[cell.index];
				startCell.symbol = cell.symbol;
			}
			board.errorCells.clear();

			puzzleData.id = puzzleId;
			puzzleData.transform = transform;
			puzzleData.grid = gridTransformed;
			puzzleData.markers.fill(0);

			Undo.set(board);
			saveData();
			draw();
		});
	});
};

if (!loaded) loadSudoku();

title.style.fontSize = (headerHeight * 0.75) + 'px';
title.style.fontWeight = 'bold';
title.style.lineHeight = headerHeight + 'px';
title.style.textAlign = 'center';
title.style.position = 'absolute';
title.style.top = headerHeight / 2 + 'px';
title.style.left = '50%';
title.style.transform = 'translate(-50%, -50%)';
let titleString = null;
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
if (titleString === null) titleString = "Level 1";
title.appendChild(document.createTextNode(titleString));

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

const setMarkerButton = () => {
	Menu.markerButton.title = pickerMarkerMode ? "Digits" : "Candidates";
}
Menu.markerButton.addEventListener('click', () => {
	pickerMarkerMode = !pickerMarkerMode;
	setMarkerButton();
	setMarkerMode();
	saveData();
	draw();
});
setMarkerButton();

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
	draw();
	window.setTimeout(() => {
		if (solved) {
			alert("Puzzle Complete!!!");
		} else if (errorCount > 0) {
			if (errorCount === 1) alert(errorCount + " Error!");
			else alert(errorCount + " Errors!");
		} else {
			alert("No Errors!");
		}
	}, 0);
});

let infoContainer = null;
let frameResize = null;
Menu.infoButton.addEventListener('click', () => {
	if (!infoContainer) {
		const headerHeight = 24;
		const borderWidth = 3;
		const margin = 16;
		const windowMargin = 64;

		infoContainer = document.createElement('div');
		infoContainer.style.position = 'absolute';
		infoContainer.style.top = '50%';
		infoContainer.style.left = '50%';
		infoContainer.style.transform = 'translate(-50%, -50%)';
		infoContainer.style.display = 'none';
		infoContainer.style.background = 'hsl(0 100% 99%)';
		// infoContainer.style.backdropFilter = 'blur(3px)';

		const infoBacking = document.createElement('div');
		infoBacking.style.position = 'absolute';
		infoBacking.style.overflow = 'clip';
		infoBacking.style.width = '100%';
		infoBacking.style.height = '100%';
		infoBacking.style.left = -borderWidth + 'px';
		infoBacking.style.top = -borderWidth + 'px';
		infoBacking.style.border = borderWidth + 'px solid black';
		infoBacking.style.borderRadius = '8px';
		// infoBacking.style.boxShadow = '0px 0px 3px black';

		const frame = document.createElement('iframe');
		frame.style.top = headerHeight + 'px';
		frame.style.borderTop = '1px solid rgba(0,0,0,0.5)';
		frame.style.borderBottom = 'none';
		frame.style.borderLeft = 'none';
		frame.style.borderRight = 'none';
		frame.style.position = 'absolute';
		frame.style.overflow = 'visible';
		frame.style.background = 'white';

		const setWidth = () => {
			const max = window.innerWidth - windowMargin;
			let fixedWidth = Math.min(max, 512);
			infoContainer.style.width = fixedWidth + 'px';
			frame.style.width = fixedWidth + 'px';
		};
		setWidth();

		let loaded = false;
		frameResize = () => {
			if (!infoContainer.parentElement) return;
			if (!loaded) return;

			setWidth();

			const body = frame.contentWindow.document.body;
			const html = body.parentElement;
			const scroll = html.scrollTop;

			const max = window.innerHeight - windowMargin - headerHeight;
			frame.style.height = frame.contentWindow.document.body.scrollHeight + margin * 2 + 'px';

			let height = frame.contentWindow.document.body.scrollHeight + margin * 2;

			if (height > max) height = max;

			infoContainer.style.height = height + headerHeight + 'px';
			frame.style.height = height + 'px';

			html.scrollTop = scroll;
		};
		frame.onload = () => {
			loaded = true;
			infoContainer.style.display = 'block';
			frame.contentWindow.document.body.style.margin = margin + 'px';
			frameResize();
		};
		window.addEventListener('resize', frameResize);
		frame.src = "./info.html";

		const closeButton = document.createElement('img');
		closeButton.src = "./icons/close_small_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
		const size = headerHeight;
		const padding = 16;
		closeButton.width = size;
		closeButton.height = size;
		closeButton.style.width = size + 'px';
		closeButton.style.height = size + 'px';
		closeButton.style.position = 'absolute';
		closeButton.style.paddingTop = padding + 'px';
		closeButton.style.paddingLeft = padding + 'px';
		closeButton.style.paddingRight = padding + 'px';
		closeButton.style.paddingBottom = '0px';

		closeButton.style.top = -padding + 'px';
		closeButton.style.right = -padding + 'px';

		closeButton.addEventListener('click', () => {
			if (infoContainer.parentElement) {
				infoContainer.parentElement.removeChild(infoContainer);
			}
		});

		infoBacking.appendChild(frame);
		infoContainer.appendChild(infoBacking);
		infoContainer.appendChild(closeButton);
	}

	if (!infoContainer.parentElement) {
		document.body.appendChild(infoContainer);
		if(frameResize) frameResize();
	}
});

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
		if (findAnimating) return;

		const name = levelMode ? titleString : Menu.menuTitle(strategy);
		if (!window.confirm("Do you want to find a new " + name + " puzzle?")) return;
		selected = false;
		loadSudoku();
	});
}

Menu.reset.addEventListener('click', () => {
	if (findAnimating) return;

	const name = levelMode ? titleString : Menu.menuTitle(strategy);
	if (!window.confirm("Do you want to restart this " + name + " puzzle?")) return;
	selected = false;
	board.resetGrid();
	Undo.set(board);
	saveData();
	draw();
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

		const buffer = Math.max(landscapeWidth - boxSize, 0) / 3;

		board.canvas.style.top = '50%';
		board.canvas.style.left = padding + buffer + 'px';
		board.canvas.style.transform = 'translate(0%, -50%)';

		pickerContainer.style.bottom = '50%';
		pickerContainer.style.right = padding + buffer + 'px';
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

		const buffer = Math.max(portraitHeight - boxSize, 0) / 3;

		board.canvas.style.top = buffer + 'px';
		board.canvas.style.left = '50%';
		board.canvas.style.transform = 'translate(-50%, 0%)';

		pickerContainer.style.bottom = buffer + 'px';
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
