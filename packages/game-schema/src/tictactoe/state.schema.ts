import { ArraySchema, filterChildren, MapSchema, type } from '@colyseus/schema'
import {
    TurnBasedActionSchema,
    TurnBasedAreaSchema,
    TurnBasedMoveSchema,
    TurnBasedPlayableObject,
    TurnBasedPlayableObjectSchema,
    TurnBasedPlayerSchema,
    TurnBasedResultSchema,
    TurnBasedStateSchema,
    TurnBasedSummarySchema
} from '@tabletop-arena/schema'
import { Client } from 'colyseus'

import { Action, Area, Move, Player, Position, Role, Table, TicTacToeState } from './state'

export class TableSchema extends TurnBasedPlayableObjectSchema implements Table {
    @type({ map: 'string' }) cells: MapSchema<Role, Position> = new MapSchema<Role, Position>()
}

export class AreaSchema extends TurnBasedAreaSchema<TableSchema, TurnBasedPlayableObject> implements Area {
    constructor() {
        super(new TableSchema())
    }
}

export class ActionSchema extends TurnBasedActionSchema implements Action {
    @type('string') readonly role: Role
    @type('string') readonly position: Position

    constructor(role: Role, position: Position) {
        super()
        this.role = role
        this.position = position
    }
}

export class PlayerSchema extends TurnBasedPlayerSchema implements Player {
    @type('string') role: Role = Role.Ex
}

export class MoveSchema extends TurnBasedMoveSchema implements Move<Action> {
    @type(ActionSchema) readonly action: Action

    constructor(notation: string, action: Action) {
        super(notation)
        this.action = action
    }
}

export class ResultSchema extends TurnBasedResultSchema {}

export class TicTacToeStateSchema
    extends TurnBasedStateSchema<Area, Action, Player, Move<Action>>
    implements TicTacToeState
{
    @filterChildren(function (this: TicTacToeStateSchema, client: Client, _: string, value: ActionSchema) {
        const player = this.players.find(({ id, role }) => id === client.sessionId && role === value.role)
        return player != null && this.area.global.cells.get(value.position) == null
    })
    actions: ArraySchema<Action> = new ArraySchema<Action>()

    constructor() {
        super(new AreaSchema(), new TurnBasedSummarySchema())
    }
}
