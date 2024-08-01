import { Client } from '@colyseus/core'
import { Schema } from '@colyseus/schema'

import { IdToken } from '../auth'
import { GameClock } from './game-clock'

export abstract class GameEngine<State extends Schema, Settings extends object> {
    #state: State
    #settings: Settings
    #started: boolean
    #ended: boolean
    #minClients: number
    #maxClients: number

    protected clock!: GameClock

    constructor(state: State, settings: Settings) {
        this.#state = state
        this.#settings = settings
        this.#started = false
        this.#ended = false
        this.#minClients = 1
        this.#maxClients = Infinity
    }

    get state(): State {
        return this.#state
    }

    get settings(): Settings {
        return this.#settings
    }

    init(clock: GameClock, settings?: Settings): void {
        this.#settings = {
            ...this.#settings,
            ...settings
        }
        this.clock = clock

        const [minClients, maxClients] = this.onInit()
        this.#minClients = minClients
        this.#maxClients = maxClients
    }

    connect(client: Client, idToken: IdToken): void {
        this.onConnect(client, idToken)
    }

    disconnect(client: Client): void {
        this.onDisconnect(client)
    }

    reconnect(client: Client): void {
        this.onReconnect(client)
    }

    start(): void {
        this.#started = this.onStart()
    }

    dispose(): void {
        this.onDispose()
    }

    handleAction(client: Client, payload: object): void {
        this.#ended = this.onAction(client, payload)
    }

    get started(): boolean {
        return this.#started
    }

    get ended(): boolean {
        return this.#ended
    }

    get minClients(): number {
        return this.#minClients
    }

    get maxClients(): number {
        return this.#maxClients
    }

    abstract get ready(): boolean

    protected abstract onInit(): [number, number]
    protected abstract onConnect(client: Client, idToken: IdToken): void
    protected abstract onDisconnect(client: Client): void
    protected abstract onReconnect(client: Client): void

    protected abstract onStart(): boolean
    protected abstract onAction(client: Client, payload: object): boolean
    protected abstract onDispose(): void
}
