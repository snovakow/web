import { CellCandidate, Grid } from "../sudokulib/Grid.js";
import { sudokuGenerator, STRATEGY } from "../sudokulib/generator.js";

const cells = new Grid();
for (let i = 0; i < 81; i++) cells[i] = new CellCandidate(i);

let puzzleCount = 0;

const simples = [STRATEGY.SIMPLE_HIDDEN];

const emptyCount = (cells) => {
	let count = 0;
	for (let i = 0; i < 81; i++) {
		const cell = cells[i];
		if (cell.symbol === 0) count++;
	}
	return count;
}

const fillSolve = () => {
	let hiddenSimple = 0;
	let remaining = emptyCount(cells);
	while (remaining > 0) {
		if (simpleHidden(cells)) {
			hiddenSimple++;
			remaining--;
		}
		else break;
	}

	if (remaining > 0) false;
	return true
}

const step = () => {
	const [clueCount, puzzleFilled] = sudokuGenerator(cells);

	const data = {
		puzzle: cells.string(),
		cells: cells.toData()
	};

	for (const cell of cells) if (cell.symbol === 0) cell.fill();

	const solved = fillSolve(cells, simples, []);
	data.puzzleClues = data.puzzle;
	data.puzzleFilled = puzzleFilled.join('');
	data.clueCount = clueCount;

	data.solved = solved;

	puzzleCount++;

	postMessage(data);

	if (puzzleStrings) return puzzleStrings.length > 0;
	return solved;
};

onmessage = (event) => {
	while (!step());
};
