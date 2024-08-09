import { ArraySchema } from '@colyseus/schema'
import {
    AlreadyEndedError,
    Identity,
    IdentitySchema,
    InvalidActionError,
    InvalidPlayerError,
    UnavailableSeatError
} from '@tabletop-arena/game-engine'
import {
    Action,
    ActionSchema,
    Area,
    ResultSchema,
    Move,
    MoveSchema,
    Player,
    PlayerSchema,
    Position,
    Role,
    TicTacToeStateSchema
} from '@tabletop-arena/tictactoe'
import { injectable } from 'tsyringe'

import { TurnBasedEngine } from '../../engines/turn-based-engine'
import { GameSettings } from '../../engines/game-engine'

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

const TICTACTOE_EXPECTED_PLAYERS = 2
const TICTACTOE_STARTING_ROLE = Role.Ex

@injectable()
export class TicTacToeEngine extends TurnBasedEngine<Area, Action, Player, Move<Action>> {
    private availableSeats: Role[] = [Role.Ex, Role.Oh]

    constructor() {
        super(new TicTacToeStateSchema())
    }

    get ready(): boolean {
        return this.state.players.length === TICTACTOE_EXPECTED_PLAYERS
    }

    protected onInit(settings: Partial<GameSettings>): void {
        const { seating } = settings
        if (seating === 'random') {
            if (Math.round(Math.random()) === 1) {
                this.availableSeats.reverse()
            }
        }
    }

    protected onStart(): boolean {
        this.state.actions.push(new ActionSchema(TICTACTOE_STARTING_ROLE, Position.TopLeft))
        this.state.actions.push(new ActionSchema(TICTACTOE_STARTING_ROLE, Position.TopCenter))
        this.state.actions.push(new ActionSchema(TICTACTOE_STARTING_ROLE, Position.TopRight))
        this.state.actions.push(new ActionSchema(TICTACTOE_STARTING_ROLE, Position.CenterLeft))
        this.state.actions.push(new ActionSchema(TICTACTOE_STARTING_ROLE, Position.CenterCenter))
        this.state.actions.push(new ActionSchema(TICTACTOE_STARTING_ROLE, Position.CenterRight))
        this.state.actions.push(new ActionSchema(TICTACTOE_STARTING_ROLE, Position.BottomLeft))
        this.state.actions.push(new ActionSchema(TICTACTOE_STARTING_ROLE, Position.BottomCenter))
        this.state.actions.push(new ActionSchema(TICTACTOE_STARTING_ROLE, Position.BottomRight))

        return true
    }

    protected onJoin(identity: Identity, existing: PlayerSchema | null): PlayerSchema {
        const player = new PlayerSchema(identity)
        if (existing != null) {
            player.role = existing.role
        } else {
            const role = this.availableSeats.shift()
            if (role == null) {
                throw new UnavailableSeatError()
            }
            player.role = role
            player.isCurrentTurn = role === TICTACTOE_STARTING_ROLE
        }

        return player
    }

    protected onMove(player: PlayerSchema, action: Action): void {
        if (this.ended) {
            throw new AlreadyEndedError()
        }

        const currentPlayer = this.state.players.find(
            ({ userId, role }) => userId === player.userId && role === action.role
        )
        if (currentPlayer == null) {
            throw new InvalidPlayerError()
        }
        currentPlayer.isCurrentTurn = false

        const actionIndex = this.state.actions.findIndex(
            ({ position, role }) => position === action.position && role === action.role
        )
        if (actionIndex === -1) {
            throw new InvalidActionError('unexpected action')
        }

        this.state.area.global.cells.set(action.position, action.role)

        this.state.summary.moves.push(new MoveSchema(action.position, new ActionSchema(action.role, action.position)))

        const result = this.checkResult()
        if (result == null) {
            const otherRole = action.role === Role.Ex ? Role.Oh : Role.Ex
            const currentTurn = this.state.players.find(({ role }) => role === otherRole) ?? null
            if (currentTurn != null) {
                currentTurn.isCurrentTurn = true
            }

            this.state.actions.splice(actionIndex, 1)
            this.state.actions = new ArraySchema<Action>(
                ...this.state.actions.map(({ position }) => new ActionSchema(otherRole, position))
            )
        } else {
            this.state.actions.clear()
            this.state.summary.result = result
        }
    }

    private checkResult(): ResultSchema | null {
        const moves = decisivePositions.map((positions) =>
            positions.map((pos) => this.state.area.global.cells.get(pos))
        )

        const winningMove = moves.find((roles) => {
            const move = roles.find((role) => role != null)
            return move != null && roles.every((role) => role === move)
        })
        if (winningMove != null) {
            const winner = this.state.players.find(({ role }) => role === winningMove.at(0))
            return new ResultSchema(
                false,
                winner == null
                    ? null
                    : new ArraySchema<Identity>(
                          new IdentitySchema({
                              id: winner.id,
                              name: winner.name,
                              userId: winner.userId
                          })
                      )
            )
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
