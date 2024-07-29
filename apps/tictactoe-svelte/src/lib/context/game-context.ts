import { RealtimeClient } from '@tabletop-arena/game-client'
import { getContext, hasContext, setContext } from 'svelte'

import { PUBLIC_COLYSEUS_ENDPOINT } from '$env/static/public'
import { createRealtimeGameStore } from '$lib/store/realtime-game-store'
import type { RealtimeGameStore } from '$lib/store/realtime-game-store'

const GameContextSymbol = Symbol('game-context')
const RealtimeClientSymbol = Symbol('realtime-client')

interface GameContextOptions {
    authToken?: string
}

export interface GameContext<State> {
    createRealtimeGameStore(name: string, initialState: State): RealtimeGameStore<State>
    getRealtimeGameStore(name: string, initialState: State): RealtimeGameStore<State>
}

export const initGameContext = <State>(options?: GameContextOptions): GameContext<State> => {
    if (hasContext(GameContextSymbol)) {
        const context = getContext<GameContext<State>>(GameContextSymbol)
        return context
    }

    const { authToken } = options ?? {}
    initRealtimeClient(authToken)

    const stores: Record<string, RealtimeGameStore<State>> = {}

    return setContext(GameContextSymbol, {
        createRealtimeGameStore: (name, initialState) => {
            stores[name] = createRealtimeGameStore(name, initialState)
            return stores[name]
        },
        getRealtimeGameStore: (name, initialState) => {
            if (stores[name] == null) {
                stores[name] = createRealtimeGameStore(name, initialState)
            }
            return stores[name]
        }
    })
}

const initRealtimeClient = (authToken?: string): RealtimeClient =>
    setContext(RealtimeClientSymbol, new RealtimeClient(PUBLIC_COLYSEUS_ENDPOINT, authToken))
export const getRealtimeClient = (): RealtimeClient => getContext(RealtimeClientSymbol)
