import { ArraySchema, Schema, type } from '@colyseus/schema'

import { Duration } from './duration'
import { DurationSchema } from './duration.schema'
import { Identity } from './identity'
import { IdentitySchema } from './identity.schema'
import {
    TurnBasedAction,
    TurnBasedArea,
    TurnBasedMove,
    TurnBasedPlayer,
    TurnBasedStatus,
    TurnBasedScorecard,
    TurnBasedState
} from './turn-based-state'

export class TurnBasedScorecardSchema extends Schema implements TurnBasedScorecard {
    @type('string') userId: Identity['userId']
    @type('boolean') playing: boolean = false

    constructor(userId: Identity['userId']) {
        super()
        this.userId = userId
    }
}

export class TurnBasedAreaSchema<TScorecard extends TurnBasedScorecard>
    extends Schema
    implements TurnBasedArea<TScorecard>
{
    @type({ array: TurnBasedScorecardSchema }) scorecards: ArraySchema<TScorecard> = new ArraySchema<TScorecard>()
}

export class TurnBasedActionSchema extends Schema implements TurnBasedAction {}

export class TurnBasedPlayerSchema extends IdentitySchema implements TurnBasedPlayer {
    @type(DurationSchema) timeout: Duration = new DurationSchema()
}

export class TurnBasedMoveSchema extends Schema implements TurnBasedMove {
    @type('string') readonly notation: string

    constructor(notation: string) {
        super()
        this.notation = notation
    }
}

export class TurnBasedResultSchema extends Schema implements TurnBasedStatus {
    @type('boolean') ended: boolean = false
    @type('boolean') draw: boolean = false
    @type({ array: IdentitySchema }) winners: ArraySchema<Identity> | null = null
}

export class TurnBasedStateSchema<
        TArea extends TurnBasedArea<TScorecard>,
        TAction extends TurnBasedAction,
        TScorecard extends TurnBasedScorecard,
        TPlayer extends TurnBasedPlayer,
        TMove extends TurnBasedMove = TurnBasedMove,
        TResult extends TurnBasedStatus = TurnBasedStatus
    >
    extends Schema
    implements TurnBasedState<TArea, TAction, TScorecard, TPlayer, TMove, TResult>
{
    @type(TurnBasedAreaSchema) area: TArea
    @type({ array: TurnBasedActionSchema }) actions: ArraySchema<TAction> = new ArraySchema<TAction>()

    @type({ array: TurnBasedPlayerSchema }) players: ArraySchema<TPlayer> = new ArraySchema<TPlayer>()
    @type({ array: IdentitySchema }) spectators: ArraySchema<Identity> = new ArraySchema<Identity>()

    @type({ array: TurnBasedMoveSchema }) moves: ArraySchema<TMove> = new ArraySchema<TMove>()
    @type(TurnBasedResultSchema) status: TResult

    constructor(area: TArea, result: TResult) {
        super()
        this.area = area
        this.status = result
    }
}
