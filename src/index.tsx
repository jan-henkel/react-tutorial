import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.css';

class Dimensions {
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }
    area(): number {
        return this.width * this.height;
    }
    readonly width: number;
    readonly height: number;
}

class SquareProperties {
    value: string | null | undefined;
    onClick: (() => void) | undefined;
}

class BoardRepresentation {
    constructor(dimensions: Dimensions, squares: Array<string | null> = Array<string | null>(dimensions.area()).fill(null)) {
        this.dimensions = dimensions;
        this.squares = squares;
    }
    squares: Array<string | null>;
    dimensions: Dimensions;
}

class WinConditionPattern {
    readonly height: number;
    readonly width: number;
    private pattern: Array<boolean>;

    constructor(pattern: Array<string>) {
        this.height = pattern.length;
        this.width = pattern[0].length;
        this.pattern = Array<boolean>(this.height * this.width).fill(false);
        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                const index = y * this.width + x;
                this.pattern[index] = (pattern[y][x] === '*');
            }
        }
    }

    checkPattern(board: BoardRepresentation, row: number, col: number): string | null {
        const boardHeight = board.dimensions.height;
        const boardWidth = board.dimensions.width;
        const squares = board.squares;
        if (row + this.height > boardHeight || col + this.width > boardWidth) {
            return null;
        }
        let entry: string | null = null;
        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                const patternIndex = y * this.width + x;
                const boardIndex = (y + row) * boardWidth + x + col;
                if (this.pattern[patternIndex]) {
                    if (!squares[boardIndex]) {
                        return null;
                    }
                    if (!entry) {
                        entry = squares[boardIndex];
                    }
                    if (entry !== squares[boardIndex]) {
                        return null;
                    }
                }
            }
        }
        return entry;
    }
}

interface BoardProperties extends BoardRepresentation {
    onClick: (index: number) => void;
}

// function component
function Square(props: SquareProperties) {
    return (
        <button className="square" onClick={props.onClick}>
            {props.value}
        </button>
    );
}

function numRange(start: number, end: number, stepsize: number = 1): Array<number> {
    return Array<undefined>(Math.floor((end - start + stepsize - 1) / stepsize))
        .fill(undefined)
        .map((_, i) => i * stepsize + start);
}

class Board extends React.Component<BoardProperties> {
    renderSquare(i: number) {
        return <Square
            key={i}
            value={this.props.squares[i]}
            onClick={() => { this.props.onClick(i) }}
        />;
    }

    renderRow(row: number) {
        const start: number = this.props.dimensions.width * row;
        const end: number = this.props.dimensions.width * (row + 1);
        return (<div className="board-row" key={row}>
            {numRange(start, end).map(i => this.renderSquare(i))}
        </div>);
    }

    render() {
        return (
            <div>
                {numRange(0, this.props.dimensions.height).map(i => this.renderRow(i))}
            </div>
        );
    }
}

class GameState {
    constructor(dimensions: Dimensions) {
        this.boardHistory = [new BoardRepresentation(dimensions)];
    }
    boardHistory: Array<BoardRepresentation>;
    xIsNext: boolean = true;
    winner: string | null = null;
    stepNumber: number = 0;
}

interface GameProperties {
    dimensions: Dimensions;
    winConditionPatterns: Array<WinConditionPattern>;
}

class Game extends React.Component<GameProperties, GameState> {
    constructor(props: GameProperties) {
        super(props);
        this.state = new GameState(props.dimensions);
    }

    handleClick(i: number) {
        const stepNumber = this.state.stepNumber;
        const history = this.state.boardHistory.slice(0, stepNumber + 1);
        const current = history[stepNumber];
        const squares = current.squares.slice();
        if (this.state.winner || squares[i]) {
            return;
        }
        squares[i] = this.state.xIsNext ? 'X' : 'O';
        const newBoard = new BoardRepresentation(this.props.dimensions, squares);
        this.setState({
            boardHistory: history.concat([newBoard]),
            xIsNext: !this.state.xIsNext,
            winner: calculateWinner(newBoard, this.props.winConditionPatterns),
            stepNumber: history.length,
        });
        console.log(`handleClick(${i}) was called. squares[${i}]=${squares[i]}`);
    }

    jumpTo(step: number) {
        const board = this.state.boardHistory[step];
        this.setState({
            stepNumber: step,
            winner: calculateWinner(board, this.props.winConditionPatterns),
            xIsNext: (step % 2) === 0,
        })
    }

    render() {
        const stepNumber = this.state.stepNumber;
        const winner = this.state.winner;
        const history = this.state.boardHistory;
        const current = history[stepNumber];
        const squares = current.squares.slice();
        const turn = history.length;

        let status = `Turn ${turn}. `;
        if (winner) {
            status += 'Winner: ' + winner;
        }
        else if (stepNumber === squares.length) {
            status += 'Tie'
        }
        else {
            status += 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
        }

        const moves = history.map((step, move) => {
            const desc = move ?
                'Go to move #' + move :
                'Go to game start';
            return (
                <li key={move}>
                    <button onClick={() => this.jumpTo(move)}>{desc}</button>
                </li>
            );
        });

        return (
            <div className="game">
                <div className="game-board">
                    <Board
                        dimensions={this.props.dimensions}
                        squares={squares}
                        onClick={(i) => this.handleClick(i)}
                    />
                </div>
                <div className="game-info">
                    <div>{status}</div>
                    <ol>{moves}</ol>
                </div>
            </div>
        );
    }
}


const winConditionsGlobal: Array<WinConditionPattern> = [
    new WinConditionPattern([
        "***"
    ]),
    new WinConditionPattern([
        "*",
        "*",
        "*"
    ]),
    new WinConditionPattern([
        "*00",
        "0*0",
        "00*"
    ]),
    new WinConditionPattern([
        "00*",
        "0*0",
        "*00"
    ])
];

const dimensionsGlobal = new Dimensions(3, 3);
// ========================================

ReactDOM.render(
    <Game dimensions={dimensionsGlobal} winConditionPatterns={winConditionsGlobal} />,
    document.getElementById('root')
);

function calculateWinner(board: BoardRepresentation, winConditionParrerns: Array<WinConditionPattern>): string | null {
    const boardHeight = board.dimensions.height;
    const boardWidth = board.dimensions.width;
    for (let pattern of winConditionParrerns) {
        for (let row = 0; row <= (boardHeight - pattern.height); ++row) {
            for (let col = 0; col <= (boardWidth - pattern.width); ++col) {
                let checkResult = pattern.checkPattern(board, row, col);
                if (checkResult) {
                    return checkResult;
                }
            }
        }
    }
    return null;
}