import { Client } from '@colyseus/core'
import { Schema } from '@colyseus/schema'
import { InvalidActionError } from '@tabletop-arena/game-engine'

import { IdToken } from '../auth'
import { GameClock } from './game-clock'

export interface GameSettings {
    seating?: 'fifo' | 'random'
}

export abstract class GameEngine<State extends Schema, Settings extends GameSettings> {
    #state: State
    #started: boolean
    #ended: boolean

    protected clock!: GameClock

    constructor(state: State) {
        this.#state = state
        this.#started = false
        this.#ended = false
    }

    get state(): State {
        return this.#state
    }

    init(clock: GameClock, settings?: Partial<Settings>): void {
        this.clock = clock

        this.onInit(settings ?? {})
    }

    connect(client: Client, idToken: IdToken): void {
        this.onConnect(client, idToken)
        this.validate()
    }

    disconnect(client: Client): void {
        this.onDisconnect(client)
        this.validate()
    }

    reconnect(client: Client): void {
        this.onReconnect(client)
        this.validate()
    }

    start(): void {
        this.#started = this.onStart()
        this.validate()
    }

    dispose(): void {
        this.onDispose()
    }

    handleAction(client: Client, payload: object): void {
        if (this.#ended) {
            throw new InvalidActionError('game is already ended')
        }

        this.#ended = this.onAction(client, payload)
        this.validate()
    }

    get started(): boolean {
        return this.#started
    }

    get ended(): boolean {
        return this.#ended
    }

    abstract get ready(): boolean
    abstract validate(): void

    protected abstract onInit(settings: Partial<Settings>): void
    protected abstract onConnect(client: Client, idToken: IdToken): void
    protected abstract onDisconnect(client: Client): void
    protected abstract onReconnect(client: Client): void

    protected abstract onStart(): boolean
    protected abstract onAction(client: Client, payload: object): boolean
    protected abstract onDispose(): void
}
