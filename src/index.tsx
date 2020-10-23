import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Size, Point, area } from './modules/rect'
import { numRange, mapIterable } from './modules/range_iterable'
import update from 'immutability-helper'
import './index.css';

class Board {
    constructor(size: Size, squares: Array<string | null> = Array(area(size)).fill(null)) {
        this.size = size;
        this.squares = squares;
    }
    resize(newSize: Size): Board {
        let newSquares = Array(area(newSize)).fill(null);
        for (let y = 0; y < newSize.height; ++y) {
            for (let x = 0; x < newSize.width; ++x) {
                if (y < this.size.height && x < this.size.width) {
                    newSquares[y * newSize.width + x] = this.squares[y * this.size.width + x];
                }
            }
        }
        return new Board(newSize, newSquares);
    }
    squares: Array<string | null>;
    size: Size;
}

function matchWinConditionAtOrigin(board: Board, winCondition: Board, topLeft: Point): string | null {
    const boardHeight = board.size.height;
    const boardWidth = board.size.width;
    const patternHeight = winCondition.size.height;
    const patternWidth = winCondition.size.width;
    const squares = board.squares;
    if (topLeft.y + patternHeight > boardHeight || topLeft.x + patternWidth > boardWidth) {
        return null;
    }
    let entry: string | null = null;
    for (let y = 0; y < patternHeight; ++y) {
        for (let x = 0; x < patternWidth; ++x) {
            const patternIndex = y * patternWidth + x;
            const boardIndex = (y + topLeft.y) * boardWidth + x + topLeft.x;
            if (winCondition.squares[patternIndex]) {
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

interface VictoryData {
    winner: string;
    winCondition: Board;
    origin: Point;
}

function matchWinCondition(board: Board, winCondition: Board): VictoryData | null {
    for (let y = 0; y <= (board.size.height - winCondition.size.height); ++y) {
        for (let x = 0; x <= (board.size.width - winCondition.size.width); ++x) {
            const origin = { x, y };
            let winner = matchWinConditionAtOrigin(board, winCondition, origin);
            if (winner) {
                return { winner, winCondition, origin };
            }
        }
    }
    return null;
}

function matchWinConditions(board: Board, winConditions: Array<Board>): VictoryData | null {
    for (let pattern of winConditions) {
        let checkResult = matchWinCondition(board, pattern);
        if (checkResult) {
            return checkResult;
        }
    }
    return null;
}

interface SquareProperties {
    value: string | null;
    onClick: (() => void);
    color?: string;
}

interface BoardProperties {
    board: Board;
    onClick: (index: number) => void;
    highlight?: { squares: Array<boolean>, color: string };
}

// function component
function Square(props: SquareProperties) {
    return (
        <button className="square" style={props.color ? { backgroundColor: props.color } : {}} onClick={props.onClick}>
            {props.value}
        </button>
    );
}

class BoardComponent extends React.Component<BoardProperties> {
    renderSquare(i: number) {
        return <Square
            key={i}
            value={this.props.board.squares[i]}
            color={this.props.highlight?.squares[i] ? this.props.highlight.color : undefined}
            onClick={() => this.props.onClick(i)}
        />;
    }

    renderRow(row: number) {
        const start: number = this.props.board.size.width * row;
        const end: number = this.props.board.size.width * (row + 1);
        return (<div className="board-row" key={row}>
            {Array.from(mapIterable(numRange(start, end), (i) => this.renderSquare(i)))}
        </div>);
    }

    render() {
        return (
            <div>
                {Array.from(
                    mapIterable(
                        numRange(0, this.props.board.size.height),
                        (i => this.renderRow(i))))}
            </div>
        );
    }
}

class GameState {
    constructor(size: Size) {
        this.boardHistory = [new Board(size)];
    }
    boardHistory: Array<Board>;
    xIsNext: boolean = true;
    victoryData: VictoryData | null = null;
    stepNumber: number = 0;
}

interface Settings {
    boardSize: Size;
    winConditions: Array<Board>;
}

interface State {
    gameState: GameState;
    settings: Settings;
}

interface SettingsProperties {
    settings: Settings;
    onSettingsChanged: (settings: Settings) => void;
}

// The game component needs to know settings and game state
interface GameProperties {
    gameState: GameState;
    settings: Settings;
    onStateChange: (stateUpdate: GameState) => void;
}

class Game extends React.Component<GameProperties> {
    handleClick(i: number): void {
        const gameState = this.props.gameState;
        const stepNumber = gameState.stepNumber;
        const history = gameState.boardHistory.slice(0, stepNumber + 1);
        const currentBoard = history[stepNumber];
        if (gameState.victoryData || currentBoard.squares[i]) {
            return;
        }
        const newBoard = new Board(
            this.props.settings.boardSize,
            update(currentBoard.squares, { [i]: { $set: gameState.xIsNext ? 'X' : 'O' } }));
        this.props.onStateChange({
            boardHistory: history.concat([newBoard]),
            xIsNext: !gameState.xIsNext,
            victoryData: matchWinConditions(newBoard, this.props.settings.winConditions),
            stepNumber: history.length
        });
    }

    jumpTo(step: number) {
        const newState = update(this.props.gameState,
            {
                stepNumber: { $set: step },
                victoryData: { $set: matchWinConditions(this.props.gameState.boardHistory[step], this.props.settings.winConditions) },
                xIsNext: { $set: (step % 2) === 0 }
            })
        this.props.onStateChange(newState);
    }

    renderStatus(gameState: GameState) {
        let status = `Turn ${gameState.stepNumber}. `;
        const board = gameState.boardHistory[gameState.stepNumber];
        let color = "white";
        if (gameState.victoryData) {
            status += 'Winner: ' + gameState.victoryData.winner;
            color = this.getPlayerColor(gameState.victoryData.winner);
        }
        else if (gameState.stepNumber === board.squares.length) {
            status += 'Tie'
        }
        else {
            const player = (gameState.xIsNext ? 'X' : 'O');
            status += 'Next player: ' + player;
            color = this.getPlayerColor(player);
        }
        return <div style={{ backgroundColor: color }}>{status}</div>;
    }

    renderMoveHistory(gameState: GameState) {
        const moves = gameState.boardHistory.map((step, move) => {
            const desc = move ?
                'Go to move #' + move :
                'Go to game start';
            return (
                <li key={move}>
                    <button onClick={() => this.jumpTo(move)}>{desc}</button>
                </li>
            );
        });
        return <ul>{moves}</ul>;
    }

    getPlayerColor(player: string) {
        return player === 'X' ? "#AABBFF" : "#AAFFBB";
    }

    getHighlightedSquares(victoryData: VictoryData | null) {
        const boardSize = this.props.gameState.boardHistory[this.props.gameState.stepNumber].size;
        const squares = Array<boolean>(area(boardSize)).fill(false);
        if (!victoryData) {
            return { squares, color: "" };
        }
        const row = (index: number) => Math.floor(index / victoryData.winCondition.size.width);
        const col = (index: number) => index % victoryData.winCondition.size.width;
        const origin = victoryData.origin;
        victoryData.winCondition.squares.forEach(
            (value, index) => {
                squares[(origin.y + row(index)) * boardSize.width + origin.x + col(index)] = value ? true : false;
            }
        );
        const color = this.getPlayerColor(victoryData.winner);
        return { squares, color };
    }

    render() {
        const gameState = this.props.gameState;
        const board = gameState.boardHistory[gameState.stepNumber];
        const highlight = this.getHighlightedSquares(gameState.victoryData);

        return (
            <div className="game">
                <div className="game-board">
                    <BoardComponent
                        board={board}
                        highlight={highlight}
                        onClick={(i) => this.handleClick(i)}
                    />
                </div>
                <div className="game-info">
                    {this.renderStatus(gameState)}
                    {this.renderMoveHistory(gameState)}
                </div>
            </div>
        );
    }
}

const winConditionsGlobal: Array<Board> = [
    new Board(
        { width: 3, height: 3 },
        [
            "*", null, null,
            null, "*", null,
            null, null, "*",
        ]),
    new Board(
        { width: 3, height: 3 },
        [
            null, null, "*",
            null, "*", null,
            "*", null, null,
        ]),
    new Board(
        { width: 3, height: 1 },
        [
            "*", "*", "*",
        ]),
    new Board(
        { width: 1, height: 3 },
        [
            "*",
            "*",
            "*",
        ]),
];

const sizeGlobal = { width: 3, height: 3 };

class SettingsComponent extends React.Component<SettingsProperties> {
    handleNewWidth(newWidth: number) {
        const newSettings = update(this.props.settings, { boardSize: { width: { $set: newWidth } } });
        this.props.onSettingsChanged(newSettings);
    }

    handleNewHeight(newHeight: number) {
        const newSettings = update(this.props.settings, { boardSize: { height: { $set: newHeight } } });
        this.props.onSettingsChanged(newSettings);
    }

    renderBoardDimensionFields() {
        return (
            <form>
                <label htmlFor="Width">Board width (between 1 and 5):</label>
                <input
                    type="number"
                    id="widthInput"
                    defaultValue={this.props.settings.boardSize.width}
                    name="width"
                    min="1"
                    max="5"
                    onChange={(event) => this.handleNewWidth(parseInt(event.target.value))} />
                &nbsp;
                <label htmlFor="Height">Board height (between 1 and 5):</label>
                <input
                    type="number"
                    id="heightInput"
                    defaultValue={this.props.settings.boardSize.height}
                    name="height"
                    min="1"
                    max="5"
                    onChange={(event) => this.handleNewHeight(parseInt(event.target.value))} />
            </form>);
    }

    handleNewWinConditionWidth(conditionIndex: number, newWidth: number) {
        const newSettings = update(this.props.settings,
            {
                winConditions: {
                    [conditionIndex]: { $apply: (winCondition) => winCondition.resize(update(winCondition.size, { width: { $set: newWidth } })) }
                }
            });
        this.props.onSettingsChanged(newSettings);
    }

    handleNewWinConditionHeight(conditionIndex: number, newHeight: number) {
        const newSettings = update(this.props.settings,
            {
                winConditions: {
                    [conditionIndex]: { $apply: (winCondition) => winCondition.resize(update(winCondition.size, { height: { $set: newHeight } })) }
                }
            });
        this.props.onSettingsChanged(newSettings);
    }

    handleWinConditionClick(conditionIndex: number, fieldIndex: number) {
        const newSettings = update(this.props.settings,
            {
                winConditions: { [conditionIndex]: { squares: { [fieldIndex]: { $apply: (square) => square ? null : "*" } } } }
            });
        this.props.onSettingsChanged(newSettings);
    }

    eraseWinCondition(conditionIndex: number) {
        const newSettings = update(this.props.settings,
            { winConditions: { $splice: [[conditionIndex, 1]] } });
        this.props.onSettingsChanged(newSettings);
    }

    addWinCondition() {
        const newSettings = update(this.props.settings,
            {
                winConditions: {
                    $push: [
                        new Board({ width: 3, height: 3 },
                            [
                                "*", null, null,
                                null, "*", null,
                                null, null, "*",
                            ])
                    ]
                }
            });
        this.props.onSettingsChanged(newSettings);
    }

    renderWinCondition(conditionIndex: number) {
        return (
            <div id="winCondition" key={conditionIndex} >
                <hr />
                <BoardComponent board={this.props.settings.winConditions[conditionIndex]} onClick={(fieldIndex) => this.handleWinConditionClick(conditionIndex, fieldIndex)} />
                <div>
                    <label htmlFor="Width">Width (between 1 and 5):</label>
                    <input
                        type="number"
                        id="widthInput"
                        defaultValue={this.props.settings.boardSize.width}
                        name="width"
                        min="1"
                        max="5"
                        onChange={(event) => this.handleNewWinConditionWidth(conditionIndex, parseInt(event.target.value))} />
                    &nbsp;
                    <label htmlFor="Height">Height (between 1 and 5):</label>
                    <input
                        type="number"
                        id="heightInput"
                        defaultValue={this.props.settings.boardSize.height}
                        name="height"
                        min="1"
                        max="5"
                        onChange={(event) => this.handleNewWinConditionHeight(conditionIndex, parseInt(event.target.value))} />
                    &nbsp;
                    <button onClick={() => this.eraseWinCondition(conditionIndex)}>X</button>
                </div>
            </div >);
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

class GameWithSettings extends React.Component<Settings, State> {
    constructor(props: Settings) {
        super(props);
        this.state = {
            settings: props,
            gameState: new GameState(props.boardSize)
        }
        this.handleGameStateChange = this.handleGameStateChange.bind(this);
        this.handleSettingsChange = this.handleSettingsChange.bind(this);
    }

    handleGameStateChange(newGameState: GameState) {
        this.setState({ gameState: newGameState });
    }

    handleSettingsChange(newSettings: Settings) {
        this.setState({
            gameState: new GameState(newSettings.boardSize),
            settings: newSettings
        });
    }

    render() {
        return (<>
            <Game settings={this.state.settings} gameState={this.state.gameState} onStateChange={this.handleGameStateChange} />
            <br />
            <SettingsComponent settings={this.state.settings} onSettingsChanged={this.handleSettingsChange} />
        </>);
    }
}

ReactDOM.render(
    <GameWithSettings boardSize={sizeGlobal} winConditions={winConditionsGlobal} />,
    document.getElementById('root')
);
