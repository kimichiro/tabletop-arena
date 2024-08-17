import { ArraySchema, MapSchema } from '@colyseus/schema'
import {
    TurnBasedAction,
    TurnBasedArea,
    TurnBasedMove,
    TurnBasedPlayer,
    TurnBasedScorecard,
    TurnBasedState
} from '@tabletop-arena/game-engine'

export enum Role {
    Oh = 'O',
    Ex = 'X'
}

export enum Position {
    TopLeft = 'TL',
    TopCenter = 'TC',
    TopRight = 'TR',
    CenterLeft = 'CL',
    CenterCenter = 'CC',
    CenterRight = 'CR',
    BottomLeft = 'BL',
    BottomCenter = 'BC',
    BottomRight = 'BR'
}

export interface Scorecard extends TurnBasedScorecard {
    role: Role
}

export interface Board {
    cells: MapSchema<Role, Position>
}

export interface Area<TScorecard extends Scorecard> extends TurnBasedArea<TScorecard> {
    board: Board
}

export interface Action extends TurnBasedAction {
    readonly role: Role
    readonly position: Position
}

export interface Player extends TurnBasedPlayer {
    role: Role
}

export interface Move extends TurnBasedMove {
    readonly action: Action
}

export interface TicTacToeState extends TurnBasedState<Area<Scorecard>, Action, Scorecard, Player, Move> {}

export const createInitialState = (): TicTacToeState => ({
    area: {
        scorecards: new ArraySchema(),
        board: { cells: new MapSchema() }
    },
    actions: new ArraySchema(),
    players: new ArraySchema(),
    spectators: new ArraySchema(),
    moves: new ArraySchema(),
    status: {
        ended: false,
        draw: false,
        winners: null
    }
})
