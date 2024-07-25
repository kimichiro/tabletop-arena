import { ArraySchema, filterChildren, MapSchema, type } from '@colyseus/schema'
import {
    TurnBasedActionSchema,
    TurnBasedAreaSchema,
    TurnBasedMoveSchema,
    TurnBasedParticipantSchema,
    TurnBasedResultSchema,
    TurnBasedSchema
} from '@tabletop-arena/schema'
import { Client } from 'colyseus'

import { Action, Area, Move, Participant, Position, Result, Role, TicTacToeState } from './state'

export class ActionSchema extends TurnBasedActionSchema implements Action {
    @type('string') readonly role: Role
    @type('string') readonly position: Position

    constructor(role: Role, position: Position) {
        super()
        this.role = role
        this.position = position
    }
}

export class AreaSchema extends TurnBasedAreaSchema<ActionSchema> implements Area<ActionSchema> {
    @type({ map: 'string' }) table: MapSchema<Role, Position> = new MapSchema<Role, Position>()

    @filterChildren(function (this: AreaSchema, client: Client, _: string, value: ActionSchema, root: TicTacToeSchema) {
        return (
            client.sessionId === root.currentTurn?.id &&
            value.role === root.currentTurn?.role &&
            this.table.get(value.position) == null
        )
    })
    actions: ArraySchema<ActionSchema> = new ArraySchema<ActionSchema>()
}

export class ParticipantSchema extends TurnBasedParticipantSchema implements Participant {
    @type('string') role: Role = Role.Ex
}

export class MoveSchema extends TurnBasedMoveSchema implements Move<ActionSchema> {
    @type(ActionSchema) readonly action: ActionSchema

    constructor(notation: string, action: ActionSchema) {
        super(notation)
        this.action = action
    }
}

export class ResultSchema extends TurnBasedResultSchema<ParticipantSchema> implements Result<ParticipantSchema> {}

export class TicTacToeSchema
    extends TurnBasedSchema<ActionSchema, AreaSchema, ParticipantSchema, MoveSchema, ResultSchema>
    implements TicTacToeState<ActionSchema, AreaSchema, ParticipantSchema, MoveSchema, ResultSchema> {}
