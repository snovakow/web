import { CellCandidate, Grid } from "../sudokulib/Grid.js";
import { sudokuGenerator, STRATEGY } from "../sudokulib/generator.js";
import { simpleHidden } from "../sudokulib/solver.js";

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
	let remaining = emptyCount(cells);
	while (remaining > 0) {
		if (simpleHidden(cells)) {
			remaining--;
		}
		else break;
	}

	return (remaining === 0);
}

const step = () => {
	const [clueCount, puzzleFilled] = sudokuGenerator(cells);

	const data = {
		puzzleClues: cells.string(),
		cells: cells.toData()
	};

	for (const cell of cells) if (cell.symbol === 0) cell.fill();

	const solved = fillSolve(cells, simples, []);
	data.puzzleFilled = puzzleFilled.join('');
	data.clueCount = clueCount;

	data.solved = solved;

	puzzleCount++;
	data.id = puzzleCount;
	data.solved = solved;

	postMessage(data);

	return solved;
};

onmessage = (event) => {
	while (!step());
};
