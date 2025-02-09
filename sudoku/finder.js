import { CellCandidate, Grid } from "../sudokulib/Grid.js";
import { sudokuGenerator } from "../sudokulib/generator.js";

const candidates = (cells) => {
	for (let index = 0; index < 81; index++) {
		const cell = cells[index];
		const symbol = cell.symbol;
		if (symbol === 0) continue;

		const row = Math.floor(index / 9);
		const col = index % 9;
		const boxRow = 3 * Math.floor(row / 3);
		const boxCol = 3 * Math.floor(col / 3);
		for (let i = 0; i < 9; i++) {
			cells[row * 9 + i].mask &= ~(0x0001 << symbol);
			cells[i * 9 + col].mask &= ~(0x0001 << symbol);

			const m = boxRow + Math.floor(i / 3);
			const n = boxCol + i % 3;
			cells[m * 9 + n].mask &= ~(0x0001 << symbol);
		}
	}
}
const hiddenSingles = (cells) => {
	let reduced = 0;
	for (let x = 1; x <= 9; x++) {
		for (const group of Grid.groupTypes) {
			let symbolCell = null;
			let indexCell = 0;
			for (const index of group) {
				const cell = cells[index];
				if (cell.symbol !== 0) continue;
				if ((cell.mask & (0x0001 << x)) === 0x0000) continue;
				if (symbolCell === null) {
					symbolCell = cell;
					indexCell = index;
				} else {
					symbolCell = null; break;
				}
			}
			if (symbolCell !== null) {
				symbolCell.symbol = x;
				symbolCell.mask = 0x0000;

				const row = Math.floor(indexCell / 9);
				const col = indexCell % 9;
				const boxRow = 3 * Math.floor(row / 3);
				const boxCol = 3 * Math.floor(col / 3);
				for (let i = 0; i < 9; i++) {
					cells[row * 9 + i].mask &= ~(0x0001 << x);
					cells[i * 9 + col].mask &= ~(0x0001 << x);

					const m = boxRow + Math.floor(i / 3);
					const n = boxCol + i % 3;
					cells[m * 9 + n].mask &= ~(0x0001 << x);
				}

				reduced++;
			}
		}
	}
	return reduced;
}

const cells = new Grid();
for (let i = 0; i < 81; i++) cells[i] = new CellCandidate(i);

let puzzleCount = 0;

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
	candidates(cells);
	while (remaining > 0) {
		const reduced = hiddenSingles(cells);
		remaining -= reduced;
		if (reduced === 0) break;
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

	const solved = fillSolve();

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
