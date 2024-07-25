import { ArraySchema, Schema, type } from '@colyseus/schema'

import {
    TurnBasedAction,
    TurnBasedArea,
    TurnBasedMove,
    TurnBasedParticipant,
    TurnBasedResult,
    TurnBasedState
} from '../state/turn-based-state'
import { ConnectionSchema, IdentitySchema } from './identity'
import { TimeDurationSchema } from './time'

export class TurnBasedActionSchema extends Schema implements TurnBasedAction {}

export class TurnBasedAreaSchema<TAction extends TurnBasedActionSchema>
    extends Schema
    implements TurnBasedArea<TAction>
{
    @type({ array: TurnBasedActionSchema })
    actions: ArraySchema<TAction> = new ArraySchema<TAction>()
}

export class TurnBasedParticipantSchema extends IdentitySchema implements TurnBasedParticipant {
    @type(ConnectionSchema) connection: ConnectionSchema = new ConnectionSchema()
    @type(TimeDurationSchema) remainingTime: TimeDurationSchema = new TimeDurationSchema()
}

export class TurnBasedMoveSchema extends Schema implements TurnBasedMove {
    @type('string') readonly notation: string

    constructor(notation: string) {
        super()
        this.notation = notation
    }
}

export class TurnBasedResultSchema<TParticipant extends TurnBasedParticipantSchema>
    extends Schema
    implements TurnBasedResult<TParticipant>
{
    @type('boolean') readonly draw: boolean
    @type({ array: TurnBasedParticipantSchema }) readonly winner: ArraySchema<TParticipant> | null

    constructor(draw: boolean, winner: ArraySchema<TParticipant> | null) {
        super()
        this.draw = draw
        this.winner = winner
    }
}

export class TurnBasedSchema<
        TAction extends TurnBasedActionSchema,
        TArea extends TurnBasedAreaSchema<TAction>,
        TParticipant extends TurnBasedParticipantSchema = TurnBasedParticipantSchema,
        TMove extends TurnBasedMoveSchema = TurnBasedMoveSchema,
        TResult extends TurnBasedResultSchema<TParticipant> = TurnBasedResultSchema<TParticipant>
    >
    extends Schema
    implements TurnBasedState<TAction, TArea, TParticipant, TMove, TResult>
{
    @type(TurnBasedAreaSchema) area: TArea
    @type({ array: TurnBasedParticipantSchema }) participants: ArraySchema<TParticipant>
    @type(TurnBasedParticipantSchema) currentTurn: TParticipant | null

    @type({ array: TurnBasedMoveSchema }) moves: ArraySchema<TMove>
    @type(TurnBasedResultSchema) result: TResult | null

    constructor(
        area: TArea,
        participants: ArraySchema<TParticipant> = new ArraySchema<TParticipant>(),
        currentTurn: TParticipant | null = null,
        moves: ArraySchema<TMove> = new ArraySchema<TMove>(),
        result: TResult | null = null
    ) {
        super()
        this.area = area
        this.participants = participants
        this.currentTurn = currentTurn
        this.moves = moves
        this.result = result
    }
}
