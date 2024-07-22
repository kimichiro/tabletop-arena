import { Client } from '@colyseus/core'
import { Schema } from '@colyseus/schema'

import { IdToken } from '../auth'
import { GameClock } from './game-clock'

export abstract class GameEngine<State extends Schema, Context extends object, Settings extends object> {
    #state: State
    #context: Context
    #settings: Settings

    protected clock!: GameClock

    constructor(state: State, context: Context, settings: Settings) {
        this.#state = state
        this.#context = context
        this.#settings = settings
    }

    get state(): State {
        return this.#state
    }

    get context(): Context {
        return this.#context
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

        this.onInit()
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
        this.onStart()
    }

    protected abstract onInit(): void
    protected abstract onConnect(client: Client, idToken: IdToken): void
    protected abstract onDisconnect(client: Client): void
    protected abstract onReconnect(client: Client): void
    protected abstract onStart(): void
}
