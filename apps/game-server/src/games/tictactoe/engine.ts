import { ArraySchema } from '@colyseus/schema'
import {
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
import { AlreadyEndedError, InvalidActionError, InvalidParticipantError } from '@tabletop-arena/schema'

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

@injectable()
export class TicTacToeEngine extends TurnBasedEngine<ActionSchema, AreaSchema, ParticipantSchema, MoveSchema> {
    constructor() {
        super(new TicTacToeStateSchema(), { roleAssignStrategy: 'fifo' })
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

        this.state.area.actions.push(new ActionSchema(currentRole, Position.TopLeft))
        this.state.area.actions.push(new ActionSchema(currentRole, Position.TopCenter))
        this.state.area.actions.push(new ActionSchema(currentRole, Position.TopRight))
        this.state.area.actions.push(new ActionSchema(currentRole, Position.CenterLeft))
        this.state.area.actions.push(new ActionSchema(currentRole, Position.CenterCenter))
        this.state.area.actions.push(new ActionSchema(currentRole, Position.CenterRight))
        this.state.area.actions.push(new ActionSchema(currentRole, Position.BottomLeft))
        this.state.area.actions.push(new ActionSchema(currentRole, Position.BottomCenter))
        this.state.area.actions.push(new ActionSchema(currentRole, Position.BottomRight))

        this.context.currentTurn = this.state.currentTurn
    }

    protected onNewParticipant(id: string, userId: string, name: string): ParticipantSchema {
        const player = new ParticipantSchema(id, name, userId)

        const { roleAssignStrategy } = this.settings
        if (roleAssignStrategy === 'fifo') {
            player.role = this.context.participants.length === 0 ? Role.Ex : Role.Oh
        } else {
            if (this.context.participants.length === 0) {
                player.role = Math.round(Math.random()) === 0 ? Role.Ex : Role.Oh
            } else {
                player.role = this.context.participants.some(({ role }) => role === Role.Ex) ? Role.Oh : Role.Ex
            }
        }

        return player
    }

    protected onUpdateParticipant(previous: ParticipantSchema, current: ParticipantSchema): void {
        current.role = previous.role

        this.state.participants = new ArraySchema(...this.context.participants)

        if (this.state.currentTurn === previous) {
            this.state.currentTurn = current
            this.context.currentTurn = this.state.currentTurn
        }
    }

    protected onMove(participant: ParticipantSchema, action: ActionSchema): void {
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

        this.context.currentTurn = this.state.currentTurn
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
