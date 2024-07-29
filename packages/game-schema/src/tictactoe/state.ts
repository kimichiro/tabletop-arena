import { ArraySchema, MapSchema } from '@colyseus/schema'
import {
    TurnBasedAction,
    TurnBasedArea,
    TurnBasedMove,
    TurnBasedParticipant,
    TurnBasedResult,
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

export interface Action extends TurnBasedAction {
    readonly role: Role
    readonly position: Position
}

export interface Area<TAction extends Action> extends TurnBasedArea<TAction> {
    table: MapSchema<Role, Position>

    actions: ArraySchema<TAction>
}

export interface Participant extends TurnBasedParticipant {
    role: Role
}

export interface Move<TAction extends Action> extends TurnBasedMove {
    readonly action: TAction
}

export type Result<TParticipant extends Participant> = TurnBasedResult<TParticipant>

export interface TicTacToeState<
    TAction extends Action = Action,
    TArea extends Area<TAction> = Area<TAction>,
    TParticipant extends Participant = Participant,
    TMove extends Move<TAction> = Move<TAction>,
    TResult extends Result<TParticipant> = Result<TParticipant>
> extends TurnBasedState<TAction, TArea, TParticipant, TMove, TResult> {}

export const createInitialState = (): TicTacToeState => ({
    area: { table: new MapSchema(), actions: new ArraySchema() },
    participants: new ArraySchema(),
    currentTurn: null,
    moves: new ArraySchema(),
    result: null
})
