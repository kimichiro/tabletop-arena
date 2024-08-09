import { ErrorCode } from '@tabletop-arena/game-engine'
import { Client } from 'colyseus.js'
import type { Room } from 'colyseus.js'
import { EventEmitter } from 'eventemitter3'

export abstract class Match<State> {
    private readonly events: EventEmitter

    protected readonly client: Client
    protected room: Room<State>

    constructor(client: Client, room: Room<State>) {
        this.events = new EventEmitter()

        this.client = client
        this.room = room

        this.init()
    }

    get roomId(): string {
        return this.room.roomId
    }

    get roomName(): string {
        return this.room.name
    }

    get sessionId(): string {
        return this.room.sessionId
    }

    get state(): State {
        return this.room.state
    }

    send(type: string, message?: object): void {
        this.room.send(type, message)
    }

    async leave(consented: boolean = true): Promise<number> {
        return await this.room.leave(consented)
    }

    on(type: 'error', callback: (code: number, message?: string) => void): void
    on(type: 'leave', callback: (code: number) => void): void
    on<T>(type: string, callback: (...args: T[]) => void): void
    on<T>(type: string, callback: (...args: T[]) => void): void {
        this.events.on(type, callback)
    }

    off(type: 'error', callback: (code: number, message?: string) => void): void
    off(type: 'leave', callback: (code: number) => void): void
    off<T>(type: string, callback: (...args: T[]) => void): void
    off<T>(type: string, callback: (...args: T[]) => void): void {
        this.events.off(type, callback)
    }

    protected emit(type: string, ...args: unknown[]): void {
        this.events.emit(type, ...args)
    }

    protected abstract onInit(): void

    private init(): void {
        this.room.onError(this.emit.bind(this, 'error'))
        this.room.onLeave(this.onLeave.bind(this))

        this.onInit()
    }

    private async onLeave(code: number): Promise<void> {
        if (code !== ErrorCode.Consented) {
            this.room = await this.client.reconnect<State>(this.room.reconnectionToken)

            this.init()
            return
        }

        this.room.removeAllListeners()

        this.emit('leave', code)
    }
}
