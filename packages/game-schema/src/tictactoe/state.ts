import { ArraySchema, MapSchema } from '@colyseus/schema'
import {
    TurnBasedAction,
    TurnBasedArea,
    TurnBasedMove,
    TurnBasedPlayableObject,
    TurnBasedPlayer,
    TurnBasedState
} from '@tabletop-arena/schema'

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

export interface Table extends TurnBasedPlayableObject {
    cells: MapSchema<Role, Position>
}

export interface Area extends TurnBasedArea<Table> {}

export interface Action extends TurnBasedAction {
    readonly role: Role
    readonly position: Position
}

export interface Player extends TurnBasedPlayer {
    role: Role
}

export interface Move<TAction extends Action> extends TurnBasedMove {
    readonly action: TAction
}

export interface TicTacToeState extends TurnBasedState<Area, Action, Player, Move<Action>> {}

export const createInitialState = (): TicTacToeState => ({
    area: {
        global: { cells: new MapSchema() },
        players: new MapSchema(),
        self: null
    },
    actions: new ArraySchema(),
    players: new ArraySchema(),
    spectators: new ArraySchema(),
    summary: { moves: new ArraySchema(), result: null }
})
