import { board } from "../sudokulib/board.js";
import { generateFromSeed, generateTransform } from "../sudokulib/generator.js";

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

const isValid = (index, symbol, grid) => {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const boxRow = 3 * Math.floor(row / 3);
    const boxCol = 3 * Math.floor(col / 3);
    for (let j = 0; j < 9; j++) {
        if (grid[row * 9 + j] === symbol || grid[j * 9 + col] === symbol) return false;
        const m = boxRow + Math.floor(j / 3);
        const n = boxCol + j % 3;
        if (grid[m * 9 + n] === symbol) return false;
    }
    return true;
}
const isValidCell = (index, symbol, cells) => {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const boxRow = 3 * Math.floor(row / 3);
    const boxCol = 3 * Math.floor(col / 3);
    for (let j = 0; j < 9; j++) {
        if (cells[row * 9 + j].symbol === symbol || cells[j * 9 + col].symbol === symbol) return false;
        const m = boxRow + Math.floor(j / 3);
        const n = boxCol + j % 3;
        if (cells[m * 9 + n].symbol === symbol) return false;
    }
    return true;
}

const makeRandomClues = () => {
    // 19 - 31
    const spread = [
        245,
        50530,
        2390005,
        34104002,
        171311313,
        342166749,
        298690992,
        122936890,
        25392695,
        2782047,
        168444,
        5950,
        138,
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

            const valid = isValid(index, symbol, randomGrid);
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
    static TICK_RATE = TICK_RATE;
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
    validIndex(startIndex, endIndex) {
        for (let i = startIndex; i <= endIndex; i++) {
            const step = this.steps[i];
            if (step.symbol === 0) return i;
            const valid = isValidCell(step.index, step.symbol, board.cells);
            if (valid) return i;
        }
        return startIndex;
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
            const validIndex = this.validIndex(i, this.steps.length - 1);
            if (validIndex !== i) {
                const swap = this.steps[i];
                this.steps[i] = this.steps[validIndex];
                this.steps[validIndex] = swap;
            }
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

export { Animator };
