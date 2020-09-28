import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.css';

class SquareProperties {
    value: string | null | undefined;
    onClick: (() => void) | undefined;
}

class BoardRepresentation {
    static readonly boardLength: number = 3;
    static readonly numSquares: number = BoardRepresentation.boardLength ** 2;
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
        const start: number = BoardRepresentation.boardLength * row;
        const end: number = BoardRepresentation.boardLength * (row + 1);
        return (<div className="board-row" key={row}>
            {numRange(start, end).map(i => this.renderSquare(i))}
        </div>);
    }

    render() {
        return (
            <div>
                {numRange(0, BoardRepresentation.boardLength).map(i => this.renderRow(i))}
            </div>
        );
    }
}

class GameState {
    static readonly adjacentRequiredForWin: number = 3;
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



function calculateWinner(squares: Array<string | null>): string | null {
    const boardLength = BoardRepresentation.boardLength;
    const rows = numRange(0, boardLength)
        .map((i) =>
            numRange(
                i * boardLength,
                (i + 1) * boardLength
            )
        );
    const cols = numRange(0, boardLength)
        .map((i) =>
            numRange(
                i,
                i + (boardLength - 1) * boardLength + 1,
                boardLength
            )
        );
    // diagonals top right to bottom left
    const diagStart1 = cols[boardLength - 1].reverse().concat(rows[0].reverse().slice(1));
    // diagonals top left to bottom right
    const diagStart2 = cols[0].reverse().concat(rows[0].slice(1));
    const diagLengths = numRange(1, boardLength + 1).concat(numRange(1, boardLength).reverse());
    const diags1 = diagLengths
        .map((length, index) =>
            numRange(
                diagStart1[index],
                diagStart1[index] + length * (boardLength - 1),
                boardLength - 1)
        );
    const diags2 = diagLengths
        .map((length, index) =>
            numRange(
                diagStart2[index],
                diagStart2[index] + length * (BoardRepresentation.boardLength + 1),
                BoardRepresentation.boardLength + 1)
        );
    const lines = rows.concat(cols, diags1, diags2);
    for (const line of lines) {
        if (line.length < GameState.adjacentRequiredForWin) {
            continue;
        }
        let current: string | null = null;
        let counter: number = 0;
        for (let i of line) {
            if (squares[i] && squares[i] === current) {
                ++counter;
            }
            else {
                counter = 1;
                current = squares[i];
            }
            if (counter === GameState.adjacentRequiredForWin) {
                return squares[i];
            }
        }
    }
    return null;
}