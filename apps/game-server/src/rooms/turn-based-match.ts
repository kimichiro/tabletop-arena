import { Client, logger, Room } from '@colyseus/core'
import { IncomingMessage } from 'http'
import { container } from 'tsyringe'

import { IdToken } from '../auth'
import { GameClock } from '../engines/game-clock'
import { GameAction, TurnBasedEngine } from '../engines/turn-based-engine'

// #region Client messages

export const MatchAskMessageType = 'match-ask'
export interface MatchAskPayload {}

export const GameMoveMessageType = 'game-move'
export interface GameMovePayload<Action extends GameAction = GameAction> {
    action: Action
}

// #endregion

// #region Server messages

export const GameStartedMessageType = 'game-started'
export interface GameStartedPayload {}

export const GameEndedMessageType = 'game-ended'
export interface GameEndedPayload {}

// #endregion

export class TurnBasedMatch extends Room {
    #engine!: TurnBasedEngine

    #clock: GameClock = new GameClock(this.clock)

    static async onAuth(token: string, _: IncomingMessage): Promise<IdToken> {
        // Authenticate user
        return JSON.parse(Buffer.from(token, 'base64').toString())
    }

    onCreate(options?: unknown): void {
        this.#engine = container.resolve(this.roomName)
        this.setState(this.#engine.state)

        this.#engine.init(this.#clock, options ?? {})

        // Setup event handling
        this.onMessage(MatchAskMessageType, this.onMatchAsk.bind(this))
        this.onMessage(GameMoveMessageType, this.onGameMove.bind(this))

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
                const payload: GameEndedPayload = {}
                this.broadcast(GameEndedMessageType, payload)
            }, 0)
        }
    }

    private async onMatchAsk(client: Client, _: MatchAskPayload): Promise<void> {
        logger.info(
            `[${this.roomId}][${client.sessionId}] ${MatchAskMessageType}: room capacity ${this.clients.length}/${this.maxClients}`
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

                    const payload: GameStartedPayload = {}
                    this.broadcast(GameStartedMessageType, payload)

                    // set flag to avoid joining in-progress game room from lobby
                    await this.setMetadata({ started: true })
                } catch (error) {
                    logger.warn(`[${this.roomId}][${client.sessionId}] ${MatchAskMessageType}: ${error}`)
                }
            }
        }
    }

    private onGameMove(client: Client, payload: GameMovePayload): void {
        logger.info(`[${this.roomId}][${client.sessionId}] ${GameMoveMessageType}:`)

        const { action } = payload

        try {
            this.#engine.move(client, action)
        } catch (error) {
            logger.warn(`[${this.roomId}][${client.sessionId}] ${GameMoveMessageType}: ${error}`)
        }
    }
}
