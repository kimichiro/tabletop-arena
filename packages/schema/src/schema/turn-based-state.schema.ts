import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema'

import { Connection, Identity } from './identity'
import { ConnectionSchema, IdentitySchema } from './identity.schema'
import { TimeDuration } from './time'
import { TimeDurationSchema } from './time.schema'
import {
    TurnBasedAction,
    TurnBasedArea,
    TurnBasedMove,
    TurnBasedPlayableObject,
    TurnBasedPlayer,
    TurnBasedResult,
    TurnBasedState,
    TurnBasedSummary
} from './turn-based-state'

export class TurnBasedPlayableObjectSchema extends Schema implements TurnBasedPlayableObject {}

export class TurnBasedAreaSchema<TGlobal extends TurnBasedPlayableObject, TPlayer extends TurnBasedPlayableObject>
    extends Schema
    implements TurnBasedArea<TGlobal, TPlayer>
{
    @type(TurnBasedPlayableObjectSchema) global: TGlobal
    @type({ map: TurnBasedPlayableObjectSchema }) players: MapSchema<TPlayer, string> = new MapSchema<TPlayer, string>()
    @type(TurnBasedPlayableObjectSchema) self: TPlayer | null = null

    constructor(global: TGlobal) {
        super()
        this.global = global
    }
}

export class TurnBasedActionSchema extends Schema implements TurnBasedAction {}

export class TurnBasedPlayerSchema extends IdentitySchema implements TurnBasedPlayer {
    @type(ConnectionSchema) connection: Connection = new ConnectionSchema()
    @type(TimeDurationSchema) remainingTime: TimeDuration = new TimeDurationSchema()

    @type('boolean') isCurrentTurn: boolean = false
}

export class TurnBasedMoveSchema extends Schema implements TurnBasedMove {
    @type('string') readonly notation: string

    constructor(notation: string) {
        super()
        this.notation = notation
    }
}

export class TurnBasedResultSchema extends Schema implements TurnBasedResult {
    @type('boolean') readonly draw: boolean
    @type({ array: IdentitySchema }) readonly winner: ArraySchema<Identity> | null

    constructor(draw: boolean, winner: ArraySchema<Identity> | null) {
        super()
        this.draw = draw
        this.winner = winner
    }
}

export class TurnBasedSummarySchema<TMove extends TurnBasedMove, TResult extends TurnBasedResult>
    extends Schema
    implements TurnBasedSummary<TMove, TResult>
{
    @type({ array: TurnBasedMoveSchema }) moves: ArraySchema<TMove> = new ArraySchema<TMove>()
    @type(TurnBasedResultSchema) result: TResult | null = null
}

export class TurnBasedStateSchema<
        TArea extends TurnBasedArea,
        TAction extends TurnBasedAction,
        TPlayer extends TurnBasedPlayer,
        TMove extends TurnBasedMove = TurnBasedMove,
        TResult extends TurnBasedResult = TurnBasedResult,
        TSummary extends TurnBasedSummary<TMove, TResult> = TurnBasedSummary<TMove, TResult>
    >
    extends Schema
    implements TurnBasedState<TArea, TAction, TPlayer, TMove, TResult, TSummary>
{
    @type(TurnBasedAreaSchema) area: TArea
    @type({ array: TurnBasedActionSchema }) actions: ArraySchema<TAction> = new ArraySchema<TAction>()

    @type({ array: TurnBasedPlayerSchema }) players: ArraySchema<TPlayer> = new ArraySchema<TPlayer>()
    @type({ array: IdentitySchema }) spectators: ArraySchema<Identity> = new ArraySchema<Identity>()

    @type(TurnBasedSummarySchema) summary: TSummary

    constructor(area: TArea, summary: TSummary) {
        super()
        this.area = area
        this.summary = summary
    }
}
