import { Client } from '@colyseus/core'
import { ArraySchema, Schema, type } from '@colyseus/schema'

import { IdToken } from '../auth'
import { CountdownTimer } from './game-clock'
import { GameContext, GameEngine } from './game-engine'

export class GameAction extends Schema {}

export abstract class GameArea<Action extends GameAction> extends Schema {
    @type({ array: GameAction }) actions: ArraySchema<Action> = new ArraySchema<Action>()
}

export type ConnectionStatus = 'unknown' | 'online' | 'offline'
export class Connection extends Schema {
    @type('string') status: ConnectionStatus = 'unknown'
}

export class TimeDuration extends Schema {
    @type('number') minutes: number = 0
    @type('number') seconds: number = 0

    @type('number') asMilliseconds: number = 0
}

export class GameParticipant extends Schema {
    @type('string') id: string
    @type('string') name: string
    @type('string') userId: string
    @type(Connection) connection: Connection = new Connection()
    @type(TimeDuration) remainingTime: TimeDuration = new TimeDuration()

    constructor(id: string, name: string, userId: string) {
        super()

        this.id = id
        this.name = name
        this.userId = userId
    }
}

export class GameMove extends Schema {
    @type('string') notation: string
    @type(GameParticipant) participant: GameParticipant

    constructor(notation: string, participant: GameParticipant) {
        super()

        this.notation = notation
        this.participant = participant
    }
}

export class GameResult extends Schema {
    @type('boolean') draw: boolean
    @type(GameParticipant) winner: GameParticipant | null

    constructor(draw: boolean, winner: GameParticipant | null) {
        super()

        this.draw = draw
        this.winner = winner
    }
}

export class GameState<
    Action extends GameAction,
    Area extends GameArea<Action>,
    Participant extends GameParticipant = GameParticipant,
    Move extends GameMove = GameMove,
    Result extends GameResult = GameResult
> extends Schema {
    @type(GameArea) area: Area
    @type({ array: GameParticipant }) participants: ArraySchema<Participant>
    @type(GameParticipant) currentTurn: Participant | null

    @type({ array: GameMove }) moves: ArraySchema<Move>
    @type(GameResult) result: Result | null

    constructor(
        area: Area,
        participants: ArraySchema<Participant> = new ArraySchema<Participant>(),
        currentTurn: Participant | null = null,
        moves: ArraySchema<Move> = new ArraySchema<Move>(),
        result: Result | null = null
    ) {
        super()

        this.area = area
        this.participants = participants
        this.currentTurn = currentTurn
        this.moves = moves
        this.result = result
    }
}

export type RoleAssignStrategy = 'fifo' | 'random'

export interface GameSettings {
    roleAssignStrategy: RoleAssignStrategy
}

export type ResultCallback = () => void

export interface TurnBasedContext<Participant extends GameParticipant> extends GameContext {
    started: boolean

    minParticipants: number
    maxParticipants: number
    participants: Participant[]

    currentTurn: Participant | null
}

const TURN_BASED_TIMEOUT_INITIAL = 30000
const TURN_BASED_TIMEOUT_RESTORE_DEFAULT = 20000
const TURN_BASED_TIMEOUT_RESTORE_MINIMUM = 10000

export abstract class TurnBasedEngine<
    Action extends GameAction = GameAction,
    Area extends GameArea<Action> = GameArea<Action>,
    Participant extends GameParticipant = GameParticipant,
    Move extends GameMove = GameMove,
    Result extends GameResult = GameResult,
    Settings extends GameSettings = GameSettings
> extends GameEngine<GameState<Action, Area, Participant, Move, Result>, TurnBasedContext<Participant>, Settings> {
    #timers: Map<Participant, CountdownTimer> = new Map<Participant, CountdownTimer>()
    #currentTurn: Participant | null = null

    constructor(state: GameState<Action, Area, Participant, Move, Result>, settings: Settings) {
        super(
            state,
            {
                started: false,
                minParticipants: 1,
                maxParticipants: Infinity,
                participants: [],

                get currentTurn() {
                    return getCurrentTurn()
                },
                set currentTurn(participant) {
                    setCurrentTurn(participant)
                }
            },
            settings
        )

        const getCurrentTurn = (): Participant | null => this.#currentTurn
        const setCurrentTurn = (participant: Participant | null) => {
            if (this.#currentTurn != null) {
                this.pauseCountdownTimer(this.#currentTurn)
            }
            this.#currentTurn = participant
            if (this.#currentTurn != null) {
                this.resumeCountdownTimer(this.#currentTurn)
            }
        }
    }

    override start(): void {
        this.onStart()
        this.context.started = true
    }

    move(client: Client, action: Action): void {
        const participant = this.context.participants.find(({ id }) => id === client.sessionId)
        if (participant == null) {
            throw new Error('Invalid client')
        }

        this.onMove(participant, action)
    }

    protected onConnect(client: Client, idToken: IdToken): void {
        let participantIndex: number = -1
        if (this.context.participants.length === this.context.maxParticipants) {
            // reject different user from joining in-progress game room
            participantIndex = this.context.participants.findIndex(({ userId }) => userId === idToken.id)
            if (participantIndex === -1) {
                client.leave()
                return
            }
        }

        const oldParticipant = participantIndex === -1 ? null : this.context.participants[participantIndex]
        const newParticipant = this.onNewParticipant(client.sessionId, idToken.id, idToken.name)
        if (participantIndex !== -1) {
            this.context.participants.splice(participantIndex, 1, newParticipant)
        } else {
            this.context.participants.push(newParticipant)
        }

        this.createCountdownTimer(newParticipant, oldParticipant == null)

        if (oldParticipant != null) {
            newParticipant.connection = oldParticipant.connection
            newParticipant.remainingTime = oldParticipant.remainingTime
            this.onUpdateParticipant(oldParticipant, newParticipant)
        }
    }

    protected onDisconnect(client: Client): void {
        const participant = this.context.participants.find(({ id }) => id === client.sessionId)
        if (participant != null) {
            this.disposeCountdownTimer(participant)
        }
    }

    protected onReconnect(_: Client): void {}

    protected abstract onNewParticipant(id: string, userId: string, name: string): Participant

    protected abstract onUpdateParticipant(previous: Participant, current: Participant): void

    protected abstract onMove(participant: Participant, action: Action): void

    private createCountdownTimer(participant: Participant, renew: boolean): void {
        const timer = this.clock.createCountdownTimer(
            renew ? TURN_BASED_TIMEOUT_INITIAL : participant.remainingTime.asMilliseconds,
            ({ minutes, seconds, asMilliseconds }) => {
                participant.remainingTime.minutes = minutes
                participant.remainingTime.seconds = seconds
                participant.remainingTime.asMilliseconds = asMilliseconds
            }
        )
        this.#timers.set(participant, timer)

        participant.remainingTime.minutes = timer.minutes
        participant.remainingTime.seconds = timer.seconds
        participant.remainingTime.asMilliseconds = timer.asMilliseconds

        this.#timers.set(participant, timer)
    }

    private resumeCountdownTimer(participant: Participant): void {
        const timer = this.#timers.get(participant)
        if (timer != null) {
            timer.resume()

            participant.remainingTime.minutes = timer.minutes
            participant.remainingTime.seconds = timer.seconds
            participant.remainingTime.asMilliseconds = timer.asMilliseconds
        }
    }

    private pauseCountdownTimer(participant: Participant): void {
        const timer = this.#timers.get(participant)
        if (timer != null) {
            timer.pause()

            const regainTimeout =
                timer.asMilliseconds > TURN_BASED_TIMEOUT_INITIAL
                    ? TURN_BASED_TIMEOUT_RESTORE_MINIMUM
                    : TURN_BASED_TIMEOUT_RESTORE_DEFAULT
            timer.increase(regainTimeout)

            participant.remainingTime.minutes = timer.minutes
            participant.remainingTime.seconds = timer.seconds
            participant.remainingTime.asMilliseconds = timer.asMilliseconds
        }
    }

    private disposeCountdownTimer(participant: Participant): void {
        this.#timers.get(participant)?.clear()
        this.#timers.delete(participant)
    }
}
