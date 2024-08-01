import { Client, Deferred, logger, Room } from '@colyseus/core'
import { Schema } from '@colyseus/schema'
import {
    ActionMessageName,
    ActionPayload,
    ErrorCode,
    GameError,
    OnEndedMessageName,
    OnStartMessageName
} from '@tabletop-arena/schema'
import { IncomingMessage } from 'http'
import { container } from 'tsyringe'

import { IdToken } from '../auth'
import { GameClock } from '../engines/game-clock'
import { GameEngine } from '../engines/game-engine'

interface Connection {
    client: Client
    idToken: IdToken
    reconnection: Deferred<Client> | null
}

const QUICK_MATCH_RECONNECTION_TIMEOUT = 60000

export class QuickMatch extends Room {
    #engine!: GameEngine<Schema, object>

    #clock: GameClock = new GameClock(this.clock)
    #connection: Connection[] = []

    static async onAuth(token: string, _: IncomingMessage): Promise<IdToken> {
        // authenticate user
        return JSON.parse(Buffer.from(token, 'base64').toString())
    }

    onCreate(options?: object): void {
        this.#engine = container.resolve(this.roomName)
        this.setState(this.#engine.state)

        this.#engine.init(this.#clock, options ?? {})

        // setup event handling
        this.onMessage(ActionMessageName, this.onAction.bind(this))
    }

    async onJoin(client: Client, _?: unknown, idToken?: IdToken): Promise<void> {
        logger.info(
            `[${this.roomId}][${client.sessionId}] join: room capacity ${this.clients.length}/${this.#engine.maxClients}`
        )

        if (idToken == null) {
            client.leave()
            return
        }

        const connectionIndex = this.#connection.findIndex((connection) => idToken.id === connection.idToken.id)
        if (connectionIndex === -1) {
            this.#connection.push({ client, idToken, reconnection: null })
        } else {
            this.#connection.at(connectionIndex)?.reconnection?.reject(true)
            this.#connection.splice(connectionIndex, 1, { client, idToken, reconnection: null })
        }

        if (this.clients.length === this.#engine.maxClients) {
            await this.lock()
        }

        this.#engine.connect(client, idToken)

        if (this.#engine.started) {
            client.send(OnStartMessageName)
        } else if (this.#engine.ready) {
            // setup game state
            this.#engine.start()

            if (this.#engine.started) {
                this.broadcast(OnStartMessageName)
            }
        }

        await this.setMetadata({ started: this.#engine.started })
    }

    async onLeave(client: Client, consented: boolean): Promise<void> {
        logger.info(
            `[${this.roomId}][${client.sessionId}] leave(${consented}): room capacity ${this.clients.length}/${this.#engine.maxClients}`
        )

        this.#engine.disconnect(client)

        // unlock room to allow connection from a fresh reload
        await this.unlock()

        const connectionIndex = this.#connection.findIndex(
            (connection) => client.sessionId === connection.client.sessionId
        )
        let reconnect = false

        if (!consented) {
            try {
                const reconnection = this.allowReconnection(client, 'manual')

                const connection = this.#connection.at(connectionIndex)
                if (connection != null) {
                    connection.reconnection = reconnection
                }

                const timeout = this.clock.setTimeout(
                    () => reconnection.reject(false),
                    QUICK_MATCH_RECONNECTION_TIMEOUT
                )

                await reconnection
                timeout.clear()

                this.#engine.reconnect(client)
            } catch (error) {
                logger.warn(`[${this.roomId}][${client.sessionId}] reconnection: ${error}`)

                if (typeof error === 'boolean') {
                    reconnect = error
                }
            }
        }

        if (!reconnect) {
            if (connectionIndex !== -1) {
                this.#connection.splice(connectionIndex, 1)
            }
        }
    }

    onBeforePatch(): void {
        if (this.#engine.ended) {
            setTimeout(() => {
                this.broadcast(OnEndedMessageName)
            }, 0)
        }
    }

    onDispose(): void {
        this.#engine.dispose()
    }

    private onAction(client: Client, payload: ActionPayload<object>): void {
        try {
            this.#engine.handleAction(client, payload)
        } catch (error) {
            logger.warn(`[${this.roomId}][${client.sessionId}] action: ${error}`)

            const code = error instanceof GameError ? error.code : ErrorCode.Consented
            const message = error instanceof Error ? error.message : `${error}`
            client.error(code, message)
        }
    }
}
