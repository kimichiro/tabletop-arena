import { ArraySchema } from '@colyseus/schema'

import { Identity } from './identity'
import { ConnectionSchema } from './identity.schema'
import { TimeDurationSchema } from './time.schema'

export interface TurnBasedAction {}

export interface TurnBasedArea<TAction extends TurnBasedAction> {
    actions: ArraySchema<TAction>
}

export interface TurnBasedParticipant extends Identity {
    connection: ConnectionSchema
    remainingTime: TimeDurationSchema
}

export interface TurnBasedMove {
    readonly notation: string
}

export interface TurnBasedResult<TParticipant extends TurnBasedParticipant> {
    readonly draw: boolean
    readonly winner: ArraySchema<TParticipant> | null
}

export interface TurnBasedState<
    TAction extends TurnBasedAction,
    TArea extends TurnBasedArea<TAction>,
    TParticipant extends TurnBasedParticipant,
    TMove extends TurnBasedMove,
    TResult extends TurnBasedResult<TParticipant>
> {
    area: TArea
    participants: ArraySchema<TParticipant>
    currentTurn: TParticipant | null

    moves: ArraySchema<TMove>
    result: TResult | null
}
