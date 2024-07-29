import {
    MatchAskMessageName,
    ActionMessageName,
    OnStartMessageName,
    OnEndedMessageName,
    OnStateChangedMessageName
} from '@tabletop-arena/schema'
import type { ActionPayload, OnStateChangedPayload } from '@tabletop-arena/schema'

import { Match } from './match'

export class RealtimeMatch<State> extends Match<State> {
    send(type: typeof MatchAskMessageName): void
    send<Action extends object>(type: typeof ActionMessageName, payload: ActionPayload<Action>): void
    send<T extends object>(type: string, message?: T): void
    send<T extends object>(type: string, message?: T): void {
        super.send(type, message)
    }

    on(type: typeof OnStartMessageName, callback: () => void): void
    on(type: typeof OnEndedMessageName, callback: () => void): void
    on(type: typeof OnStateChangedMessageName, callback: (state: OnStateChangedPayload<State>) => void): void
    on(type: 'error', callback: (code: number, message?: string) => void): void
    on(type: 'leave', callback: (code: number) => void): void
    on<T>(type: string, callback: (...args: T[]) => void): void
    on<T>(type: string, callback: (...args: T[]) => void): void {
        super.on(type, callback)
    }

    off(type: typeof OnStartMessageName, callback: () => void): void
    off(type: typeof OnEndedMessageName, callback: () => void): void
    off(type: typeof OnStateChangedMessageName, callback: (state: OnStateChangedPayload<State>) => void): void
    off(type: 'error', callback: (code: number, message?: string) => void): void
    off(type: 'leave', callback: (code: number) => void): void
    off<T>(type: string, callback: (...args: T[]) => void): void
    off<T>(type: string, callback: (...args: T[]) => void): void {
        super.off(type, callback)
    }

    protected onInit(): void {
        this.room.onMessage(OnStartMessageName, this.emit.bind(this, OnStartMessageName))
        this.room.onMessage(OnEndedMessageName, this.emit.bind(this, OnEndedMessageName))
        this.room.onStateChange(this.emit.bind(this, OnStateChangedMessageName))
    }
}
