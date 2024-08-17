import { ArraySchema } from '@colyseus/schema'

import { Duration } from './duration'
import { Identity } from './identity'

export interface TurnBasedScorecard {
    userId: Identity['userId']
    playing: boolean
}

export interface TurnBasedArea<TScorecard extends TurnBasedScorecard = TurnBasedScorecard> {
    scorecards: ArraySchema<TScorecard>
}

export interface TurnBasedAction {}

export interface TurnBasedPlayer extends Identity {
    timeout: Duration
}

export interface TurnBasedMove {
    readonly notation: string
}

export interface TurnBasedStatus {
    ended: boolean
    draw: boolean
    winners: ArraySchema<Identity> | null
}

export interface TurnBasedState<
    TArea extends TurnBasedArea<TScorecard>,
    TAction extends TurnBasedAction,
    TScorecard extends TurnBasedScorecard = TurnBasedScorecard,
    TPlayer extends TurnBasedPlayer = TurnBasedPlayer,
    TMove extends TurnBasedMove = TurnBasedMove,
    TStatus extends TurnBasedStatus = TurnBasedStatus
> {
    area: TArea
    actions: ArraySchema<TAction>

    players: ArraySchema<TPlayer>
    spectators: ArraySchema<Identity>

    moves: ArraySchema<TMove>
    status: TStatus
}
