import { RealtimeMatch } from '@tabletop-arena/game-client'
import type { Action } from '@tabletop-arena/game-schema'
import { writable } from 'svelte/store'
import type { Readable } from 'svelte/store'

import { getRealtimeClient } from '$lib/context/game-context'

interface StoreState<State> {
    sessionId: string | null
    roomId: string | null
    started: boolean

    state: State
}

export interface RealtimeGameStore<State> extends Readable<StoreState<State>> {
    readonly name: string

    findMatch(roomId?: string): Promise<void>

    sendMove(action: Action): void

    leaveMatch(): Promise<void>
}

export const createRealtimeGameStore = <State>(name: string, initialState: State): RealtimeGameStore<State> => {
    const { subscribe, update } = writable<StoreState<State>>({
        sessionId: null,
        roomId: null,
        started: false,
        state: initialState
    })

    const client = getRealtimeClient()

    let match: RealtimeMatch<State> | null = null

    return {
        subscribe,
        get name() {
            return name
        },
        findMatch: async (roomId) => {
            if (match != null) {
                if (match.roomName !== name) {
                    throw new Error('Mismatch game name')
                }
                if (roomId != null && match.roomId !== roomId) {
                    throw new Error('Mismatch game room id')
                }
                return
            }

            if (roomId != null) {
                try {
                    match = await client.joinMatch(roomId)
                } catch (error) {
                    console.error(error)
                    return
                }
            } else {
                match = await client.findMatch(name)
            }

            match.on('start', () => {
                update((state) => ({
                    ...state,
                    started: true
                }))
            })
            match.on('ended', async () => {
                if (match != null) {
                    await match.leave()
                    match = null
                }
            })
            match.on('state-changed', (matchState) => {
                update((state) => ({
                    ...state,
                    state: matchState
                }))
            })
            match.send('match-ask')

            update((state) => ({
                ...state,
                sessionId: match?.sessionId ?? null,
                roomId: match?.roomId ?? null
            }))
        },
        sendMove: (action) => {
            match?.send('action', action)
        },
        leaveMatch: async () => {
            await match?.leave(true)
        }
    }
}
