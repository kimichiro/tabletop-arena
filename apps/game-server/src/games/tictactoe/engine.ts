import { ArraySchema } from '@colyseus/schema'
import {
    Action,
    ActionSchema,
    AreaSchema,
    MoveSchema,
    ResultSchema,
    TicTacToeStateSchema,
    ParticipantSchema,
    Position,
    Role
} from '@tabletop-arena/game-schema'
import { injectable } from 'tsyringe'

import { TurnBasedEngine } from '../../engines/turn-based-engine'
import { AlreadyEndedError, Identity, InvalidActionError, InvalidParticipantError } from '@tabletop-arena/schema'

const decisivePositions: Array<[Position, Position, Position]> = [
    [Position.TopLeft, Position.TopCenter, Position.TopRight],
    [Position.CenterLeft, Position.CenterCenter, Position.CenterRight],
    [Position.BottomLeft, Position.BottomCenter, Position.BottomRight],

    [Position.TopLeft, Position.CenterLeft, Position.BottomLeft],
    [Position.TopCenter, Position.CenterCenter, Position.BottomCenter],
    [Position.TopRight, Position.CenterRight, Position.BottomRight],

    [Position.TopLeft, Position.CenterCenter, Position.BottomRight],
    [Position.TopRight, Position.CenterCenter, Position.BottomLeft]
]

const TICTACTOE_MIN_PLAYERS = 2
const TICTACTOE_MAX_PLAYERS = 2
const TICTACTOE_STARTING_ROLE = Role.Ex

@injectable()
export class TicTacToeEngine extends TurnBasedEngine<ActionSchema, AreaSchema, ParticipantSchema, MoveSchema> {
    constructor() {
        super(new TicTacToeStateSchema(), { order: 'fifo' })
    }

    protected onInit(): [number, number] {
        return [TICTACTOE_MIN_PLAYERS, TICTACTOE_MAX_PLAYERS]
    }

    protected onStart(): boolean {
        this.state.currentTurn =
            this.state.participants.find((participant) => participant.role === TICTACTOE_STARTING_ROLE) ?? null

        this.state.area.actions.push(new ActionSchema(TICTACTOE_STARTING_ROLE, Position.TopLeft))
        this.state.area.actions.push(new ActionSchema(TICTACTOE_STARTING_ROLE, Position.TopCenter))
        this.state.area.actions.push(new ActionSchema(TICTACTOE_STARTING_ROLE, Position.TopRight))
        this.state.area.actions.push(new ActionSchema(TICTACTOE_STARTING_ROLE, Position.CenterLeft))
        this.state.area.actions.push(new ActionSchema(TICTACTOE_STARTING_ROLE, Position.CenterCenter))
        this.state.area.actions.push(new ActionSchema(TICTACTOE_STARTING_ROLE, Position.CenterRight))
        this.state.area.actions.push(new ActionSchema(TICTACTOE_STARTING_ROLE, Position.BottomLeft))
        this.state.area.actions.push(new ActionSchema(TICTACTOE_STARTING_ROLE, Position.BottomCenter))
        this.state.area.actions.push(new ActionSchema(TICTACTOE_STARTING_ROLE, Position.BottomRight))

        return true
    }

    protected onJoin(identity: Identity, existing: ParticipantSchema | null): ParticipantSchema {
        const player = new ParticipantSchema(identity)
        if (existing != null) {
            player.role = existing.role
        } else {
            const { order } = this.settings
            if (order === 'fifo') {
                player.role = this.state.participants.length === 0 ? Role.Ex : Role.Oh
            } else {
                if (this.state.participants.length === 0) {
                    player.role = Math.round(Math.random()) === 0 ? Role.Ex : Role.Oh
                } else {
                    player.role = this.state.participants.some(({ role }) => role === Role.Ex) ? Role.Oh : Role.Ex
                }
            }
        }

        return player
    }

    protected onMove(participant: ParticipantSchema, action: Action): void {
        const isConcluded = this.state.result != null
        if (isConcluded) {
            throw new AlreadyEndedError()
        }

        const foundParticipant = this.state.participants.some(
            ({ userId, role }) => userId === participant.userId && role === action.role
        )
        if (!foundParticipant) {
            throw new InvalidParticipantError()
        }

        const actionIndex = this.state.area.actions.findIndex(
            ({ position, role }) => position === action.position && role === action.role
        )
        if (actionIndex === -1) {
            throw new InvalidActionError('unexpected action')
        }

        this.state.area.table.set(action.position, action.role)

        this.state.moves.push(new MoveSchema(action.position, new ActionSchema(action.role, action.position)))

        const result = this.checkResult()
        if (result == null) {
            const otherRole = action.role === Role.Ex ? Role.Oh : Role.Ex
            this.state.currentTurn = this.state.participants.find(({ role }) => role === otherRole) ?? null

            this.state.area.actions.splice(actionIndex, 1)
            this.state.area.actions = new ArraySchema(
                ...this.state.area.actions.map(({ position }) => new ActionSchema(otherRole, position))
            )
        } else {
            this.state.currentTurn = null
            this.state.area.actions = new ArraySchema()

            this.state.result = result
        }
    }

    private checkResult(): ResultSchema | null {
        const moves = decisivePositions.map((positions) => positions.map((pos) => this.state.area.table.get(pos)))

        const winningMove = moves.find((roles) => {
            const move = roles.find((role) => role != null)
            return move != null && roles.every((role) => role === move)
        })
        if (winningMove != null) {
            const winner = this.state.participants.find(({ role }) => role === winningMove.at(0))
            return new ResultSchema(false, winner == null ? null : new ArraySchema(winner))
        }

        const possibleWin = moves.some((roles) => {
            const move = roles.find((role) => role != null)
            return roles.every((role) => role === move || role == null)
        })
        if (!possibleWin) {
            return new ResultSchema(true, null)
        }

        return null
    }
}
