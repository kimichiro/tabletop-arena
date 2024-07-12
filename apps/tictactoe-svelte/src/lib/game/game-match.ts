/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Room } from 'colyseus.js'
import { EventEmitter } from 'eventemitter3'
import type { GameClient } from './game-client'

// #region Client messages

export const MatchAskMessageType = 'match-ask'
export interface MatchAskPayload {}

export const GameMoveMessageType = 'game-move'
export interface GameMovePayload<Action = unknown> {
    action: Action
}

// #endregion

// #region Server messages

export const GameStartedMessageType = 'game-started'
export interface GameStartedPayload {}

export const GameEndedMessageType = 'game-ended'
export interface GameEndedPayload {}

// #endregion

export class GameMatch<State> {
    #client: GameClient
    #room: Room<State>
    #events: EventEmitter

    constructor(client: GameClient, room: Room<State>) {
        this.#client = client
        this.#room = room
        this.#events = new EventEmitter()

        this.subscribeEvents()
    }

    get roomId(): string {
        return this.#room.roomId
    }

    get roomName(): string {
        return this.#room.name
    }

    get sessionId(): string {
        return this.#room.sessionId
    }

    get state(): State {
        return this.#room.state
    }

    sendMessage(type: 'match-ask', payload: MatchAskPayload): void
    sendMessage(type: 'game-move', payload: GameMovePayload): void
    sendMessage<T>(type: string, message?: T): void {
        this.#room.send(type, message)
    }

    async leave(consented?: boolean): Promise<number> {
        return await this.#room.leave(consented)
    }

    on(type: 'game-started', callback: (payload: GameStartedPayload) => void): void
    on(type: 'game-ended', callback: (payload: GameEndedPayload) => void): void
    on(type: 'state-changed', callback: (state: State) => void): void
    on(type: 'error', callback: (code: number, message?: string) => void): void
    on(type: 'leave', callback: (code: number) => void): void
    on(type: string, callback: (...args: any[]) => void): void
    on(type: string, callback: (...args: any[]) => void): void {
        this.#events.on(type, callback)
    }

    off(type: 'game-started', callback: (payload: GameStartedPayload) => void): void
    off(type: 'game-ended', callback: (payload: GameEndedPayload) => void): void
    off(type: 'state-changed', callback: (state: State) => void): void
    off(type: 'error', callback: (code: number, message?: string) => void): void
    off(type: 'leave', callback: (code: number) => void): void
    off(type: string, callback: (...args: any[]) => void): void
    off(type: string, callback: (...args: any[]) => void): void {
        this.#events.off(type, callback)
    }

    private emit(type: string, ...args: any[]): void {
        this.#events.emit(type, ...args)
    }

    private subscribeEvents(): void {
        this.#room.onMessage(GameStartedMessageType, this.emit.bind(this, 'game-started'))
        this.#room.onMessage(GameEndedMessageType, this.emit.bind(this, 'game-ended'))
        this.#room.onStateChange(this.emit.bind(this, 'state-changed'))

        this.#room.onError(this.emit.bind(this, 'error'))
        this.#room.onLeave(this.onLeave.bind(this))
    }

    private async onLeave(code: number): Promise<void> {
        if (code !== 4000) {
            const match = await this.#client.reconnect<State>(this.#room.reconnectionToken)
            this.#client = match.#client
            this.#room = match.#room

            this.subscribeEvents()

            return
        }

        this.#room.removeAllListeners()

        this.emit('leave', code)
    }
}
