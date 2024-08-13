import { QuickMatch } from '@tabletop-arena/game-client'
import { ErrorCode } from '@tabletop-arena/game-client/schema'
import type { Action } from '@tabletop-arena/tictactoe'
import { writable } from 'svelte/store'
import type { Readable } from 'svelte/store'

import { getColyseusClient } from '$lib/context/game-context'

interface StoreState<State> {
    sessionId: string | null
    roomId: string | null

    started: boolean

    state: State
}

export interface QuickGameStore<State> extends Readable<StoreState<State>> {
    readonly name: string

    findMatch(roomId?: string): Promise<void>

    leaveMatch(): Promise<void>

    sendAction(action: Action): void
}

export const createQuickGameStore = <State>(name: string, initialState: State): QuickGameStore<State> => {
    const { subscribe, update } = writable<StoreState<State>>({
        sessionId: null,
        roomId: null,
        started: false,
        state: initialState
    })

    const client = getColyseusClient()

    let match: QuickMatch<State> | null = null

    return {
        subscribe,
        get name() {
            return name
        },
        findMatch: async (id) => {
            if (match != null) {
                if (match.roomName !== name || (id != null && match.roomId !== id)) {
                    throw new Error('The client is already joined to an unexpected match')
                }
                return
            }

            if (id != null) {
                match = await client.joinMatch(id)
            } else {
                match = await client.findMatch(name)
            }

            match.on('start', () => {
                update((state) => ({ ...state, started: true }))
            })
            match.on('ended', async () => {
                update((state) => ({ ...state, started: false }))
            })
            match.on('state-changed', (matchState) => {
                update((state) => ({ ...state, state: matchState }))
            })
            match.on('error', (code, message) => {
                if (code !== ErrorCode.Consented) {
                    /* TODO: pass error through another store */
                    console.log('error:', code, message)
                }
            })
            match.on('leave', (code) => {
                match = null

                if (code !== ErrorCode.Consented) {
                    /* TODO: pass error through another store */
                    console.log('leave:', code)
                }
            })

            const sessionId = match.sessionId
            const roomId = match.roomId
            update((state) => ({ ...state, sessionId, roomId }))
        },
        leaveMatch: async () => {
            await match?.leave()
            match = null

            update((state) => ({
                ...state,
                sessionId: null,
                roomId: null,
                state: initialState
            }))
        },
        sendAction: (action) => {
            if (match == null) {
                throw new Error('The client is disconnected')
            }
            match.send('action', action)
        }
    }
}
