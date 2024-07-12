import { writable } from 'svelte/store'
import type { Readable } from 'svelte/store'

import { getGameClient } from '$lib/context/game-context'
import type { GameMatch } from '$lib/game/game-match'
import type { GameAction } from '$lib/game/schema/tictactoe'

interface StoreState<State> {
    sessionId: string | null
    roomId: string | null
    started: boolean

    state: State
}

export interface GameStore<State> extends Readable<StoreState<State>> {
    readonly name: string

    findMatch(roomId?: string): Promise<void>

    sendMove(action: GameAction): void

    leaveMatch(): Promise<void>
}

export const createGameStore = <State>(name: string, initialState: State): GameStore<State> => {
    const { subscribe, update } = writable<StoreState<State>>({
        sessionId: null,
        roomId: null,
        started: false,
        state: initialState
    })

    const client = getGameClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let match: GameMatch<any> | null = null

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

            match.on('game-started', () => {
                update((state) => ({
                    ...state,
                    started: true
                }))
            })
            match.on('game-ended', async () => {
                if (match != null) {
                    await match.leave()
                    match = null
                }
            })
            match.on('state-changed', (matchState) => {
                update((state) => ({
                    ...state,
                    state: matchState.toJSON()
                }))
            })
            match.sendMessage('match-ask', {})

            update((state) => ({
                ...state,
                sessionId: match?.sessionId ?? null,
                roomId: match?.roomId ?? null
            }))
        },
        sendMove: (action) => {
            match?.sendMessage('game-move', { action })
        },
        leaveMatch: async () => {
            await match?.leave(true)
        }
    }
}
