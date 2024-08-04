import { ArraySchema, MapSchema } from '@colyseus/schema'

import { Connection, Identity } from './identity'
import { TimeDuration } from './time'

export interface TurnBasedArea<
    TGlobal extends TurnBasedPlayableObject = TurnBasedPlayableObject,
    TPlayer extends TurnBasedPlayableObject = TurnBasedPlayableObject
> {
    global: TGlobal
    players: MapSchema<TPlayer, Identity['userId']>
    self: TPlayer | null
}

export interface TurnBasedPlayableObject {}

export interface TurnBasedAction {}

export interface TurnBasedPlayer extends Identity {
    connection: Connection
    remainingTime: TimeDuration

    isCurrentTurn: boolean
}

export interface TurnBasedMove {
    readonly notation: string
}

export interface TurnBasedResult {
    readonly draw: boolean
    readonly winner: ArraySchema<Identity> | null
}

export interface TurnBasedSummary<TMove extends TurnBasedMove, TResult extends TurnBasedResult> {
    moves: ArraySchema<TMove>
    result: TResult | null
}

export interface TurnBasedState<
    TArea extends TurnBasedArea,
    TAction extends TurnBasedAction,
    TPlayer extends TurnBasedPlayer,
    TMove extends TurnBasedMove = TurnBasedMove,
    TResult extends TurnBasedResult = TurnBasedResult,
    TSummary extends TurnBasedSummary<TMove, TResult> = TurnBasedSummary<TMove, TResult>
> {
    area: TArea
    actions: ArraySchema<TAction>

    players: ArraySchema<TPlayer>
    spectators: ArraySchema<Identity>

    summary: TSummary
}
