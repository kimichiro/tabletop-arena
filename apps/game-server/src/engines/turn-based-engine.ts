import { Client } from '@colyseus/core'
import {
    TurnBasedActionSchema,
    TurnBasedAreaSchema,
    TurnBasedMoveSchema,
    TurnBasedParticipantSchema,
    TurnBasedResultSchema,
    TurnBasedStateSchema,
    MismatchClientError
} from '@tabletop-arena/schema'

import { IdToken } from '../auth'
import { CountdownTimer } from './game-clock'
import { GameEngine } from './game-engine'

const TURN_BASED_TIMEOUT_INITIAL = 30000
const TURN_BASED_TIMEOUT_RESTORE_DEFAULT = 20000
const TURN_BASED_TIMEOUT_RESTORE_MINIMUM = 10000

export type RoleAssignStrategy = 'fifo' | 'random'

export interface GameSettings {
    roleAssignStrategy: RoleAssignStrategy
}

export interface TurnBasedContext<Participant extends TurnBasedParticipantSchema> {
    started: boolean

    minParticipants: number
    maxParticipants: number
    participants: Participant[]

    currentTurn: Participant | null
}

export abstract class TurnBasedEngine<
    Action extends TurnBasedActionSchema = TurnBasedActionSchema,
    Area extends TurnBasedAreaSchema<Action> = TurnBasedAreaSchema<Action>,
    Participant extends TurnBasedParticipantSchema = TurnBasedParticipantSchema,
    Move extends TurnBasedMoveSchema = TurnBasedMoveSchema,
    Result extends TurnBasedResultSchema<Participant> = TurnBasedResultSchema<Participant>,
    Settings extends GameSettings = GameSettings
> extends GameEngine<
    TurnBasedStateSchema<Action, Area, Participant, Move, Result>,
    TurnBasedContext<Participant>,
    Settings
> {
    #timers: Map<Participant, CountdownTimer> = new Map<Participant, CountdownTimer>()
    #currentTurn: Participant | null = null

    constructor(state: TurnBasedStateSchema<Action, Area, Participant, Move, Result>, settings: Settings) {
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
            throw new MismatchClientError()
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
