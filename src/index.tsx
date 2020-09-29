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
    width: number;
    height: number;
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
    resize(newDimensions: Dimensions) {
        let newSquares = Array<string | null>(newDimensions.area()).fill(null);
        for (let y = 0; y < newDimensions.height; ++y) {
            for (let x = 0; x < newDimensions.width; ++x) {
                if (y < this.dimensions.height && x < this.dimensions.width) {
                    newSquares[y * newDimensions.width + x] = this.squares[y * this.dimensions.width + x];
                }
            }
        }
        this.squares = newSquares;
        this.dimensions = newDimensions;
    }
    squares: Array<string | null>;
    dimensions: Dimensions;
}

class WinConditionPattern extends BoardRepresentation {
    checkPattern(board: BoardRepresentation, row: number, col: number): string | null {
        const boardHeight = board.dimensions.height;
        const boardWidth = board.dimensions.width;
        const patternHeight = this.dimensions.height;
        const patternWidth = this.dimensions.width;
        const squares = board.squares;
        if (row + patternHeight > boardHeight || col + patternWidth > boardWidth) {
            return null;
        }
        let entry: string | null = null;
        for (let y = 0; y < patternHeight; ++y) {
            for (let x = 0; x < patternWidth; ++x) {
                const patternIndex = y * patternWidth + x;
                const boardIndex = (y + row) * boardWidth + x + col;
                if (this.squares[patternIndex]) {
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

interface BoardProperties {
    boardRepresentation: BoardRepresentation
    onClick: (index: number) => void;
}

function* numRange(start: number, end: number, stepsize: number = 1) {
    let current = start;
    while (current !== end) {
        yield current;
        current += stepsize;
    }
}

function* mapIterable<InputType, OutputType>(iterable: Iterable<InputType>, func: ((input: InputType) => OutputType)) {
    for (let i of iterable) {
        yield func(i);
    }
}

// function component
function Square(props: SquareProperties) {
    return (
        <button className="square" onClick={props.onClick}>
            {props.value}
        </button>
    );
}

class Board extends React.Component<BoardProperties> {
    renderSquare(i: number) {
        return <Square
            key={i}
            value={this.props.boardRepresentation.squares[i]}
            onClick={() => this.props.onClick(i)}
        />;
    }

    renderRow(row: number) {
        const start: number = this.props.boardRepresentation.dimensions.width * row;
        const end: number = this.props.boardRepresentation.dimensions.width * (row + 1);
        return (<div className="board-row" key={row}>
            {Array.from(mapIterable(numRange(start, end), (i) => this.renderSquare(i)))}
        </div>);
    }

    render() {
        return (
            <div>
                {Array.from(mapIterable(numRange(0, this.props.boardRepresentation.dimensions.height), (i => this.renderRow(i))))}
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
                        boardRepresentation={new BoardRepresentation(this.props.dimensions, squares)}
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
    new WinConditionPattern(
        new Dimensions(3, 3),
        [
            "*", null, null,
            null, "*", null,
            null, null, "*",
        ]),
    new WinConditionPattern(
        new Dimensions(3, 3),
        [
            null, null, "*",
            null, "*", null,
            "*", null, null,
        ]),
    new WinConditionPattern(
        new Dimensions(3, 1),
        [
            "*", "*", "*",
        ]),
    new WinConditionPattern(
        new Dimensions(1, 3),
        [
            "*",
            "*",
            "*",
        ]),
];

const dimensionsGlobal = new Dimensions(3, 3);

interface GameSettings {
    boardDimensions: Dimensions;
    winConditions: Array<WinConditionPattern>;
}

interface SettingsProperties {
    settings: GameSettings;
    onSettingsChanged: (settings: GameSettings) => void;
}

class SettingsComponent extends React.Component<SettingsProperties> {
    handleNewWidth(newWidth: number) {
        let newSettings = this.props.settings;
        newSettings.boardDimensions.width = newWidth;
        this.props.onSettingsChanged(newSettings);
    }

    handleNewHeight(newHeight: number) {
        let newSettings = this.props.settings;
        newSettings.boardDimensions.height = newHeight;
        this.props.onSettingsChanged(newSettings);
    }

    renderBoardDimensionFields() {
        return (
            <form>
                <label htmlFor="Width">Board width (between 1 and 5):</label>
                <input
                    type="number"
                    id="widthInput"
                    defaultValue={this.props.settings.boardDimensions.width}
                    name="width"
                    min="1"
                    max="5"
                    onChange={(event) => this.handleNewWidth(parseInt(event.target.value))} />
                &nbsp;
                <label htmlFor="Height">Board height (between 1 and 5):</label>
                <input
                    type="number"
                    id="heightInput"
                    defaultValue={this.props.settings.boardDimensions.height}
                    name="height"
                    min="1"
                    max="5"
                    onChange={(event) => this.handleNewHeight(parseInt(event.target.value))} />
            </form>);
    }

    handleNewWinConditionWidth(conditionIndex: number, newWidth: number) {
        let newSettings = this.props.settings;
        const height = newSettings.winConditions[conditionIndex].dimensions.height;
        newSettings.winConditions[conditionIndex].resize(new Dimensions(newWidth, height));
        this.props.onSettingsChanged(newSettings);
    }

    handleNewWinConditionHeight(conditionIndex: number, newHeight: number) {
        let newSettings = this.props.settings;
        const width = newSettings.winConditions[conditionIndex].dimensions.width;
        newSettings.winConditions[conditionIndex].resize(new Dimensions(width, newHeight));
        this.props.onSettingsChanged(newSettings);
    }

    handleWinConditionClick(conditionIndex: number, fieldIndex: number) {
        let newSettings = this.props.settings;
        let newSquares = newSettings.winConditions[conditionIndex].squares.slice();
        newSquares[fieldIndex] = newSquares[fieldIndex] ? null : "*";
        newSettings.winConditions[conditionIndex].squares = newSquares;
        this.props.onSettingsChanged(newSettings);
    }

    eraseWinCondition(conditionIndex: number) {
        let winConditions = this.props.settings.winConditions.slice();
        winConditions.splice(conditionIndex, 1);
        let newSettings = {
            boardDimensions: this.props.settings.boardDimensions,
            winConditions: winConditions
        }
        this.props.onSettingsChanged(newSettings);
    }

    addWinCondition() {
        let newSettings = this.props.settings;
        newSettings.winConditions.push(
            new WinConditionPattern(
                new Dimensions(3, 3),
                [
                    "*", null, null,
                    null, "*", null,
                    null, null, "*",
                ]));
        this.props.onSettingsChanged(newSettings);
    }

    renderWinCondition(conditionIndex: number) {
        return (
            <>
                <hr />
                <Board boardRepresentation={this.props.settings.winConditions[conditionIndex]} onClick={(fieldIndex) => this.handleWinConditionClick(conditionIndex, fieldIndex)} />
                <form>
                    <label htmlFor="Width">Width (between 1 and 5):</label>
                    <input
                        type="number"
                        id="widthInput"
                        defaultValue={this.props.settings.boardDimensions.width}
                        name="width"
                        min="1"
                        max="5"
                        onChange={(event) => this.handleNewWinConditionWidth(conditionIndex, parseInt(event.target.value))} />
                    &nbsp;
                    <label htmlFor="Height">Height (between 1 and 5):</label>
                    <input
                        type="number"
                        id="heightInput"
                        defaultValue={this.props.settings.boardDimensions.height}
                        name="height"
                        min="1"
                        max="5"
                        onChange={(event) => this.handleNewWinConditionHeight(conditionIndex, parseInt(event.target.value))} />
                    &nbsp;
                    <button onClick={() => this.eraseWinCondition(conditionIndex)}>X</button>
                </form>
            </>);
    }

    render() {
        return (
            <div>
                {this.renderBoardDimensionFields()}
                <h1>Win conditions</h1>
                {Array.from(mapIterable(numRange(0, this.props.settings.winConditions.length), (i) => this.renderWinCondition(i)))}
                <button onClick={() => this.addWinCondition()}>Add win condition</button>
            </div>);
    }
}

class GameWithSettings extends React.Component<GameSettings, GameSettings> {
    key: number = 0;
    constructor(props: GameSettings) {
        super(props);
        this.state = props;
    }
    render() {
        return (<>
            <Game key={this.key} dimensions={this.state.boardDimensions} winConditionPatterns={this.state.winConditions} />
            <br />
            <SettingsComponent settings={this.state} onSettingsChanged={(newSettings: GameSettings) => { ++this.key; this.setState(newSettings); }} />
        </>);
    }
}

ReactDOM.render(
    <GameWithSettings boardDimensions={dimensionsGlobal} winConditions={winConditionsGlobal} />,
    document.getElementById('root')
);

function calculateWinner(board: BoardRepresentation, winConditionParrerns: Array<WinConditionPattern>): string | null {
    const boardHeight = board.dimensions.height;
    const boardWidth = board.dimensions.width;
    for (let pattern of winConditionParrerns) {
        for (let row = 0; row <= (boardHeight - pattern.dimensions.height); ++row) {
            for (let col = 0; col <= (boardWidth - pattern.dimensions.width); ++col) {
                let checkResult = pattern.checkPattern(board, row, col);
                if (checkResult) {
                    return checkResult;
                }
            }
        }
    }
    return null;
}