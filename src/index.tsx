import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.css';

class SquareProperties {
    value: string | null | undefined;
    onClick: (() => void) | undefined;
}

class BoardRepresentation {
    static readonly boardHeight: number = 3;
    static readonly boardWidth: number = 3;
    static readonly numSquares: number = BoardRepresentation.boardHeight * BoardRepresentation.boardWidth;
    squares: Array<string | null> = Array<string | null>(BoardRepresentation.numSquares).fill(null);
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
        const start: number = BoardRepresentation.boardWidth * row;
        const end: number = BoardRepresentation.boardWidth * (row + 1);
        return (<div className="board-row" key={row}>
            {numRange(start, end).map(i => this.renderSquare(i))}
        </div>);
    }

    render() {
        return (
            <div>
                {numRange(0, BoardRepresentation.boardHeight).map(i => this.renderRow(i))}
            </div>
        );
    }
}

class GameState {
    history: Array<BoardRepresentation> = [new BoardRepresentation()];
    xIsNext: boolean = true;
    winner: string | null = null;
    stepNumber: number = 0;
}

class Game extends React.Component<{}, GameState> {
    constructor(props: {}) {
        super(props);
        this.state = new GameState();
    }

    handleClick(i: number) {
        const stepNumber = this.state.stepNumber;
        const history = this.state.history.slice(0, stepNumber + 1);
        const current = history[stepNumber];
        const squares = current.squares.slice();
        if (this.state.winner || squares[i]) {
            return;
        }
        squares[i] = this.state.xIsNext ? 'X' : 'O';
        this.setState({
            history: history.concat([{
                squares: squares,
            }]),
            xIsNext: !this.state.xIsNext,
            winner: calculateWinner(squares),
            stepNumber: history.length,
        });
        console.log(`handleClick(${i}) was called. squares[${i}]=${squares[i]}`);
    }

    jumpTo(step: number) {
        const squares = this.state.history[step].squares;
        this.setState({
            stepNumber: step,
            winner: calculateWinner(squares),
            xIsNext: (step % 2) === 0,
        })
    }

    render() {
        const stepNumber = this.state.stepNumber;
        const winner = this.state.winner;
        const history = this.state.history;
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

// ========================================

ReactDOM.render(
    <Game />,
    document.getElementById('root')
);

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

    checkPattern(squares: Array<string | null>, row: number, col: number): string | null {
        const boardHeight = BoardRepresentation.boardHeight;
        const boardWidth = BoardRepresentation.boardWidth;
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

const winConditionParrerns: Array<WinConditionPattern> = [
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

function calculateWinner(squares: Array<string | null>): string | null {
    const boardHeight = BoardRepresentation.boardHeight;
    const boardWidth = BoardRepresentation.boardWidth;
    for (let pattern of winConditionParrerns) {
        for (let row = 0; row <= (boardHeight - pattern.height); ++row) {
            for (let col = 0; col <= (boardWidth - pattern.width); ++col) {
                let checkResult = pattern.checkPattern(squares, row, col);
                if (checkResult) {
                    return checkResult;
                }
            }
        }
    }
    return null;
}