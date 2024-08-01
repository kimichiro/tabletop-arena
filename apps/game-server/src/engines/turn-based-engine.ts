import { Client } from '@colyseus/core'
import {
    TurnBasedActionSchema,
    TurnBasedAreaSchema,
    TurnBasedMoveSchema,
    TurnBasedParticipantSchema,
    TurnBasedResultSchema,
    TurnBasedStateSchema,
    MismatchClientError,
    Identity
} from '@tabletop-arena/schema'

import { IdToken } from '../auth'
import { CountdownTimer } from './game-clock'
import { GameEngine } from './game-engine'

const TURN_BASED_TIMEOUT_INITIAL = 30000
const TURN_BASED_TIMEOUT_ADD_DEFAULT = 20000
const TURN_BASED_TIMEOUT_ADD_MINIMUM = 10000

export type OrderShuffle = 'fifo' | 'random'

export interface TurnBasedSettings {
    order: OrderShuffle

    timeoutInitial: number
    timeoutAddDefault: number
    timeoutAddMinimum: number
}

export abstract class TurnBasedEngine<
    Action extends TurnBasedActionSchema = TurnBasedActionSchema,
    Area extends TurnBasedAreaSchema<Action> = TurnBasedAreaSchema<Action>,
    Participant extends TurnBasedParticipantSchema = TurnBasedParticipantSchema,
    Move extends TurnBasedMoveSchema = TurnBasedMoveSchema,
    Result extends TurnBasedResultSchema<Participant> = TurnBasedResultSchema<Participant>,
    Settings extends TurnBasedSettings = TurnBasedSettings
> extends GameEngine<TurnBasedStateSchema<Action, Area, Participant, Move, Result>, Settings> {
    #timers: Map<Participant, CountdownTimer> = new Map<Participant, CountdownTimer>()
    #currentTurn: Participant | null = null

    constructor(state: TurnBasedStateSchema<Action, Area, Participant, Move, Result>, settings: Partial<Settings>) {
        super(state, {
            order: settings.order ?? 'fifo',
            timeoutInitial: settings.timeoutInitial ?? TURN_BASED_TIMEOUT_INITIAL,
            timeoutAddDefault: settings.timeoutAddDefault ?? TURN_BASED_TIMEOUT_ADD_DEFAULT,
            timeoutAddMinimum: settings.timeoutAddMinimum ?? TURN_BASED_TIMEOUT_ADD_MINIMUM
        } as Settings)
    }

    override start(): void {
        super.start()
        this.validateTurn()
    }

    override get ready(): boolean {
        return this.state.participants.length === this.maxClients
    }

    protected onConnect(client: Client, idToken: IdToken): void {
        const participantIndex = this.state.participants.findIndex(({ userId }) => userId === idToken.id)
        if (participantIndex === -1) {
            // reject different user from joining in-progress game room
            if (this.started) {
                client.leave()
                return
            }
        }

        const oldParticipant = participantIndex === -1 ? null : this.state.participants[participantIndex]
        const newParticipant = this.onJoin(
            {
                id: client.sessionId,
                name: idToken.name,
                userId: idToken.id
            },
            oldParticipant
        )
        if (participantIndex !== -1) {
            this.state.participants.splice(participantIndex, 1)
        }
        this.state.participants.push(newParticipant)

        if (oldParticipant != null) {
            newParticipant.connection = oldParticipant.connection
            newParticipant.remainingTime = oldParticipant.remainingTime

            if (this.state.currentTurn === oldParticipant) {
                this.state.currentTurn = newParticipant
            }

            this.disposeCountdownTimer(oldParticipant)
        }

        this.createCountdownTimer(newParticipant, oldParticipant == null)

        newParticipant.connection.status = 'online'

        this.validateTurn()
    }

    protected onDisconnect(client: Client): void {
        const participant = this.state.participants.find(({ id }) => id === client.sessionId)
        if (participant != null) {
            participant.connection.status = 'offline'
        }
    }

    protected onReconnect(client: Client): void {
        const participant = this.state.participants.find(({ id }) => id === client.sessionId)
        if (participant != null) {
            participant.connection.status = 'online'
        }
    }

    protected onAction(client: Client, payload: object): boolean {
        const participant = this.state.participants.find(({ id }) => id === client.sessionId)
        if (participant == null) {
            throw new MismatchClientError()
        }

        this.onMove(participant, payload)

        this.validateTurn()

        return this.state.result != null
    }

    protected onDispose(): void {
        Array.from(this.#timers.values()).forEach((timer) => timer.clear())
        this.#timers.clear()
    }

    protected abstract onJoin(identity: Identity, existing: Participant | null): Participant

    protected abstract onMove(participant: Participant, payload: object): void

    private validateTurn(): void {
        if (this.#currentTurn != null) {
            this.pauseCountdownTimer(this.#currentTurn)
        }
        this.#currentTurn = this.state.currentTurn
        if (this.#currentTurn != null) {
            this.resumeCountdownTimer(this.#currentTurn)
        }
    }

    private createCountdownTimer(participant: Participant, reset: boolean): void {
        const timer = this.clock.createCountdownTimer(
            reset ? this.settings.timeoutInitial : participant.remainingTime.asMilliseconds,
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
                timer.asMilliseconds > this.settings.timeoutInitial
                    ? this.settings.timeoutAddMinimum
                    : this.settings.timeoutAddDefault
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
