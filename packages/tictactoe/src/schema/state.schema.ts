import { ArraySchema, filterChildren, MapSchema, Schema, type } from '@colyseus/schema'
import {
    Identity,
    TurnBasedActionSchema,
    TurnBasedAreaSchema,
    TurnBasedMoveSchema,
    TurnBasedPlayerSchema,
    TurnBasedResultSchema,
    TurnBasedScorecardSchema,
    TurnBasedStateSchema
} from '@tabletop-arena/game-engine'
import { Client } from 'colyseus'

import { Action, Area, Board, Move, Player, Position, Role, Scorecard, TicTacToeState } from './state'

export class ScorecardSchema extends TurnBasedScorecardSchema implements Scorecard {
    @type('string') role: Role

    constructor(userId: Identity['userId'], role: Role) {
        super(userId)
        this.role = role
    }
}

export class BoardSchema extends Schema implements Board {
    @type({ map: 'string' }) cells: MapSchema<Role, Position> = new MapSchema<Role, Position>()
}

export class AreaSchema extends TurnBasedAreaSchema<Scorecard> implements Area<Scorecard> {
    @type(BoardSchema) board: BoardSchema = new BoardSchema()
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

export class MoveSchema extends TurnBasedMoveSchema implements Move {
    @type(ActionSchema) readonly action: Action

    constructor(notation: string, action: Action) {
        super(notation)
        this.action = action
    }
}

export class TicTacToeStateSchema
    extends TurnBasedStateSchema<Area<Scorecard>, Action, Scorecard, Player, Move>
    implements TicTacToeState
{
    @filterChildren(function (this: TicTacToeStateSchema, client: Client, _: string, value: ActionSchema) {
        const player = this.players.find(({ id, role }) => id === client.sessionId && role === value.role)
        return player != null && this.area.board.cells.get(value.position) == null
    })
    actions: ArraySchema<Action> = new ArraySchema<Action>()

    constructor() {
        super(new AreaSchema(), new TurnBasedResultSchema())
    }
}
