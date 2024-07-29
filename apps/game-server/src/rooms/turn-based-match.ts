import { Client, logger, Room } from '@colyseus/core'
import { ActionSchema } from '@tabletop-arena/game-schema'
import type { Action } from '@tabletop-arena/game-schema'
import {
    ActionMessageName,
    ErrorCode,
    GameError,
    MatchAskMessageName,
    OnEndedMessageName,
    OnStartMessageName
} from '@tabletop-arena/schema'
import type { ActionPayload, MatchAskPayload } from '@tabletop-arena/schema'
import { IncomingMessage } from 'http'
import { container } from 'tsyringe'

import { IdToken } from '../auth'
import { GameClock } from '../engines/game-clock'
import { GameSettings, TurnBasedEngine } from '../engines/turn-based-engine'

export class TurnBasedMatch extends Room {
    #engine!: TurnBasedEngine

    #clock: GameClock = new GameClock(this.clock)

    static async onAuth(token: string, _: IncomingMessage): Promise<IdToken> {
        // Authenticate user
        return JSON.parse(Buffer.from(token, 'base64').toString())
    }

    onCreate(options?: GameSettings): void {
        this.#engine = container.resolve(this.roomName)
        this.setState(this.#engine.state)

        this.#engine.init(this.#clock, options)

        // Setup event handling
        this.onMessage(MatchAskMessageName, this.onMatchAsk.bind(this))
        this.onMessage(ActionMessageName, this.onAction.bind(this))

        // Lock room when reaches total number of participants
        this.maxClients = this.#engine.context.maxParticipants
    }

    async onJoin(client: Client, _?: unknown, idToken?: IdToken): Promise<void> {
        logger.info(
            `[${this.roomId}][${client.sessionId}] join: room capacity ${this.clients.length}/${this.maxClients}`
        )

        if (idToken == null) {
            client.leave()
            return
        }

        this.#engine.connect(client, idToken)

        const participant = this.#engine.context.participants.find(({ id }) => id === client.sessionId)
        if (participant != null) {
            participant.connection.status = 'online'
        }
    }

    async onLeave(client: Client, consented: boolean): Promise<void> {
        logger.info(
            `[${this.roomId}][${client.sessionId}] leave(${consented}): room capacity ${this.clients.length}/${this.maxClients}`
        )

        const participant = this.#engine.context.participants.find(({ id }) => id === client.sessionId)
        if (participant != null) {
            participant.connection.status = 'offline'
        }

        this.#engine.disconnect(client)

        // unlock room to allow connection from a fresh reload
        this.unlock()

        if (!consented) {
            try {
                await this.allowReconnection(client, 60)

                this.#engine.reconnect(client)

                const participant = this.#engine.context.participants.find(({ id }) => id === client.sessionId)
                if (participant != null) {
                    participant.connection.status = 'online'
                }
                return
            } catch (error) {
                logger.warn(`[${this.roomId}][${client.sessionId}] reconnection: ${error}`)
            }
        }
    }

    onBeforePatch(): void {
        if (this.#engine.state.result != null) {
            setTimeout(() => {
                this.broadcast(OnEndedMessageName)
            }, 0)
        }
    }

    private async onMatchAsk(client: Client, _: MatchAskPayload): Promise<void> {
        logger.info(
            `[${this.roomId}][${client.sessionId}] ${MatchAskMessageName}: room capacity ${this.clients.length}/${this.maxClients}`
        )

        if (!this.#engine.context.started) {
            const participants = this.#engine.context.participants
            if (
                this.clients.length === this.#engine.context.maxParticipants &&
                participants.length === this.#engine.context.maxParticipants &&
                participants.every(({ connection: { status } }) => status === 'online')
            ) {
                try {
                    // setup game state
                    this.#engine.start()

                    this.broadcast(OnStartMessageName)

                    // set flag to avoid joining in-progress game room from lobby
                    await this.setMetadata({ started: true })
                } catch (error) {
                    logger.warn(`[${this.roomId}][${client.sessionId}] ${MatchAskMessageName}: ${error}`)
                }
            }
        }
    }

    private onAction(client: Client, payload: ActionPayload<Action>): void {
        logger.info(`[${this.roomId}][${client.sessionId}] ${ActionMessageName}:`)

        try {
            this.#engine.move(client, new ActionSchema(payload.role, payload.position))
        } catch (error) {
            logger.warn(`[${this.roomId}][${client.sessionId}] ${ActionMessageName}: ${error}`)

            const code = error instanceof GameError ? error.code : ErrorCode.Consented
            const message = error instanceof Error ? error.message : `${error}`
            client.error(code, message)
        }
    }
}
