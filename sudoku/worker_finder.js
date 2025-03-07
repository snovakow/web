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

const reduceCell = (cells, index, symbol) => {
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
				reduceCell(cells, indexCell, x);
				reduced++;
			}
		}
	}
	return reduced;
}

const powerOf2 = x => (x & (x - 0x0001)) === 0x0000;
const nakedSingles = (cells) => {
	for (let index = 0; index < 81; index++) {
		const cell = cells[index];
		if (cell.symbol !== 0) continue;
		if (!powerOf2(cell.mask)) continue;

		for (let x = 1; x <= 9; x++) {
			if (((cell.mask >>> x) & 0x001) === 0x000) {
				cell.symbol = x;
				cell.mask = 0x0000;
				reduceCell(cells, index, x);
				return true;
			}
		}

	}
	return false;
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
	let hiddenCount = 0;
	let nakedCount = 0;
	while (remaining > 0) {
		const hiddenReduced = hiddenSingles(cells);
		hiddenCount += hiddenReduced;
		remaining -= hiddenReduced;

		if (hiddenReduced === 0 && remaining > 0) {
			const nakedReduced = nakedSingles(cells);
			if (!nakedReduced) break;
			nakedCount++;
			remaining--;
		}
	}
	return {
		solved: (remaining === 0),
		hiddenCount,
		nakedCount,
	};
}

const step = () => {
	const [clueCount, puzzleFilled] = sudokuGenerator(cells);

	const data = {
		puzzleClues: cells.string(),
		cells: cells.toData()
	};
	for (const cell of cells) if (cell.symbol === 0) cell.fill();
	candidates(cells);

	const results = fillSolve();

	data.puzzleFilled = puzzleFilled.join('');
	data.clueCount = clueCount;

	puzzleCount++;
	data.id = puzzleCount;
	data.solved = results.solved;
	data.hiddenCount = results.hiddenCount;
	data.nakedCount = results.nakedCount;

	postMessage(data);

	return results.solved;
};

onmessage = (event) => {
	while (!step());
};
