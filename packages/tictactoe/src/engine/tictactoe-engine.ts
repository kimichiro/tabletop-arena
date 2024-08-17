import { ArraySchema } from '@colyseus/schema'
import {
    AlreadyEndedError,
    GameSettings,
    Identity,
    IdentitySchema,
    InvalidActionError,
    InvalidPlayerError,
    TurnBasedEngine,
    UnavailableSeatError
} from '@tabletop-arena/game-engine'

import { Action, Area, Move, Player, Position, Role, Scorecard } from '../schema/state'
import { ActionSchema, MoveSchema, PlayerSchema, TicTacToeStateSchema, ScorecardSchema } from '../schema/state.schema'

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

export class TicTacToeEngine extends TurnBasedEngine<Area<Scorecard>, Action, Scorecard, Player, Move> {
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
        this.state.area.scorecards.push(
            ...this.state.players.map((identity) => {
                const scorecard = new ScorecardSchema(identity.userId, identity.role)
                if (scorecard.role === TICTACTOE_STARTING_ROLE) {
                    scorecard.playing = true
                }
                return scorecard
            })
        )

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

            const scorecard = this.state.area.scorecards.find(({ userId }) => userId === player.userId)
            if (scorecard != null) {
                scorecard.playing = role === TICTACTOE_STARTING_ROLE
            }
        }

        return player
    }

    protected onMove(player: PlayerSchema, action: Action): void {
        if (this.ended) {
            throw new AlreadyEndedError()
        }

        const currentScorecard = this.state.area.scorecards.find(
            ({ userId, role }) => userId === player.userId && role === action.role
        )
        if (currentScorecard == null) {
            throw new InvalidPlayerError()
        }
        currentScorecard.playing = false

        const actionIndex = this.state.actions.findIndex(
            ({ position, role }) => position === action.position && role === action.role
        )
        if (actionIndex === -1) {
            throw new InvalidActionError('unexpected action')
        }

        this.state.area.board.cells.set(action.position, action.role)

        this.state.moves.push(new MoveSchema(action.position, new ActionSchema(action.role, action.position)))

        this.validateResult()
        if (!this.state.status.ended) {
            const otherRole = action.role === Role.Ex ? Role.Oh : Role.Ex
            const nextScorecard = this.state.area.scorecards.find(({ role }) => role === otherRole)
            if (nextScorecard != null) {
                nextScorecard.playing = true
            }

            this.state.actions.splice(actionIndex, 1)
            this.state.actions = new ArraySchema<Action>(
                ...this.state.actions.map(({ position }) => new ActionSchema(otherRole, position))
            )
        } else {
            this.state.actions.clear()
        }
    }

    private validateResult(): void {
        const moves = decisivePositions.map((positions) => positions.map((pos) => this.state.area.board.cells.get(pos)))

        const decisiveMove = moves.find((roles) => {
            const move = roles.find((role) => role != null)
            return move != null && roles.every((role) => role === move)
        })
        const winner = this.state.players.find(({ role }) => role === decisiveMove?.at(0))
        if (winner != null) {
            this.state.status.ended = true
            this.state.status.winners = new ArraySchema<Identity>(
                new IdentitySchema({
                    id: winner.id,
                    name: winner.name,
                    userId: winner.userId
                })
            )
            return
        }

        const possibleWin = moves.some((roles) => {
            const move = roles.find((role) => role != null)
            return roles.every((role) => role === move || role == null)
        })
        if (!possibleWin) {
            this.state.status.ended = true
            this.state.status.draw = true
            return
        }
    }
}
