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
            value={this.props.squares[i]}
            onClick={() => { this.props.onClick(i) }}
        />;
    }

    renderRow(row: number) {
        const start: number = BoardRepresentation.boardLength * row;
        const end: number = BoardRepresentation.boardLength * (row + 1);
        return (<div className="board-row">
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

function calculateWinner(squares: Array<string | null>) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }
    return null;
}