import { ArraySchema, filterChildren, MapSchema, type } from '@colyseus/schema'
import { Client } from 'colyseus'
import { injectable } from 'tsyringe'

import {
    GameAction,
    GameArea,
    GameMove,
    GameParticipant,
    GameResult,
    GameState,
    TurnBasedEngine
} from '../../engines/turn-based-engine'

enum Role {
    Ex = 'X',
    Oh = 'O'
}

enum Position {
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

const decisivePositions: Array<[Position, Position, Position]> = [
    [Position.A1, Position.A2, Position.A3],
    [Position.B1, Position.B2, Position.B3],
    [Position.C1, Position.C2, Position.C3],

    [Position.A1, Position.B1, Position.C1],
    [Position.A2, Position.B2, Position.C2],
    [Position.A3, Position.B3, Position.C3],

    [Position.A1, Position.B2, Position.C3],
    [Position.A3, Position.B2, Position.C1]
]

class Action extends GameAction {
    @type('string') role: Role
    @type('string') position: Position

    constructor(role: Role, position: Position) {
        super()

        this.role = role
        this.position = position
    }
}

class Area extends GameArea<Action> {
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

class Player extends GameParticipant {
    @type('string') role: Role = Role.Ex
}

@injectable()
export class TicTacToeEngine extends TurnBasedEngine<Action, Area, Player> {
    constructor() {
        super(new GameState<Action, Area, Player>(new Area()), {})
    }

    protected onInit(): void {
        this.context.minParticipants = 2
        this.context.maxParticipants = 2
    }

    protected onStart(): void {
        this.state.participants.push(...this.context.participants)

        const currentRole = Role.Ex
        this.state.currentTurn =
            this.context.participants.find((participant) => participant.role === currentRole) ?? null

        this.state.area.actions.push(new Action(currentRole, Position.A1))
        this.state.area.actions.push(new Action(currentRole, Position.A2))
        this.state.area.actions.push(new Action(currentRole, Position.A3))
        this.state.area.actions.push(new Action(currentRole, Position.B1))
        this.state.area.actions.push(new Action(currentRole, Position.B2))
        this.state.area.actions.push(new Action(currentRole, Position.B3))
        this.state.area.actions.push(new Action(currentRole, Position.C1))
        this.state.area.actions.push(new Action(currentRole, Position.C2))
        this.state.area.actions.push(new Action(currentRole, Position.C3))

        this.context.currentTurn = this.state.currentTurn
    }

    protected onNewParticipant(id: string, userId: string, name: string): Player {
        const player = new Player(id, name, userId)
        if (this.context.participants.length === 0) {
            player.role = Math.round(Math.random()) === 0 ? Role.Ex : Role.Oh
        } else {
            player.role = this.context.participants.some(({ role }) => role === Role.Ex) ? Role.Oh : Role.Ex
        }

        return player
    }

    protected onUpdateParticipant(previous: Player, current: Player): void {
        current.role = previous.role

        this.state.participants = new ArraySchema(...this.context.participants)

        if (this.state.currentTurn === previous) {
            this.state.currentTurn = current
            this.context.currentTurn = this.state.currentTurn
        }
    }

    protected onMove(participant: Player, action: Action): void {
        const isConcluded = this.state.result != null
        const foundParticipant = this.state.participants.some(
            ({ userId, role }) => userId === participant.userId && role === action.role
        )
        const actionIndex = this.state.area.actions.findIndex(
            ({ position, role }) => position === action.position && role === action.role
        )

        if (isConcluded || !foundParticipant || actionIndex === -1) {
            throw new Error('Invalid move')
        }

        this.state.area.table.set(action.position, action.role)

        this.state.moves.push(new GameMove(action.position, participant))

        const result = this.checkResult()
        if (result == null) {
            const otherRole = action.role === Role.Ex ? Role.Oh : Role.Ex
            this.state.currentTurn = this.state.participants.find(({ role }) => role === otherRole) ?? null

            this.state.area.actions.splice(actionIndex, 1)
            this.state.area.actions = new ArraySchema(
                ...this.state.area.actions.map(({ position }) => new Action(otherRole, position))
            )
        } else {
            this.state.currentTurn = null
            this.state.area.actions = new ArraySchema()

            this.state.result = result
        }

        this.context.currentTurn = this.state.currentTurn
    }

    private checkResult(): GameResult | null {
        const moves = decisivePositions.map((positions) => positions.map((pos) => this.state.area.table.get(pos)))

        const winningMove = moves.find((roles) => {
            const move = roles.find((role) => role != null)
            return move != null && roles.every((role) => role === move)
        })
        if (winningMove != null) {
            const winner = this.state.participants.find(({ role }) => role === winningMove.at(0))
            return new GameResult(false, winner ?? null)
        }

        const possibleWin = moves.some((roles) => {
            const move = roles.find((role) => role != null)
            return roles.every((role) => role === move || role == null)
        })
        if (!possibleWin) {
            return new GameResult(true, null)
        }

        return null
    }
}
