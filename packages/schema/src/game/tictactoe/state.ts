import { ArraySchema, filterChildren, MapSchema, type } from '@colyseus/schema'
import { Client } from 'colyseus'

import { GameAction, GameArea, GameState, GameParticipant } from '../turn-based/state'

export enum Role {
    Ex = 'X',
    Oh = 'O'
}

export enum Position {
    A1 = 'a1',
    A2 = 'a2',
    A3 = 'a3',
    B1 = 'b1',
    B2 = 'b2',
    B3 = 'b3',
    C1 = 'c1',
    C2 = 'c2',
    C3 = 'c3'
}

export class Action extends GameAction {
    @type('string') role: Role
    @type('string') position: Position

    constructor(role: Role, position: Position) {
        super()

        this.role = role
        this.position = position
    }
}

export class Area extends GameArea<Action> {
    @type({ map: 'string' }) table: MapSchema<Role, Position> = new MapSchema<Role, Position>()

    @filterChildren(function (
        this: Area,
        client: Client,
        _: string,
        value: Action,
        root: GameState<Action, Area, Player>
    ) {
        return (
            client.sessionId === root.currentTurn?.id &&
            value.role === root.currentTurn?.role &&
            this.table.get(value.position) == null
        )
    })
    actions: ArraySchema<Action> = new ArraySchema<Action>()
}

export class Player extends GameParticipant {
    @type('string') role: Role = Role.Ex
}
