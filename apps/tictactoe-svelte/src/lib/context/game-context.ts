import { ColyseusClient } from '@tabletop-arena/game-client'
import { getContext, hasContext, setContext } from 'svelte'

import { PUBLIC_COLYSEUS_ENDPOINT } from '$env/static/public'
import { createQuickGameStore } from '$lib/store/quick-game-store'
import type { QuickGameStore } from '$lib/store/quick-game-store'

const GameContextSymbol = Symbol('game-context')
const ColyseusClientSymbol = Symbol('colyseus-client')

interface GameContextOptions {
    authToken?: string
}

export interface GameContext<State> {
    createGameStore(name: string, initialState: State): QuickGameStore<State>
    getGameStore(name: string, initialState: State): QuickGameStore<State>
}

export const initGameContext = <State>(options?: GameContextOptions): GameContext<State> => {
    if (hasContext(GameContextSymbol)) {
        const context = getContext<GameContext<State>>(GameContextSymbol)
        return context
    }

    const { authToken } = options ?? {}
    initColyseusClient(authToken)

    const stores: Record<string, QuickGameStore<State>> = {}

    return setContext(GameContextSymbol, {
        createGameStore: (name, initialState) => {
            stores[name] = createQuickGameStore(name, initialState)
            return stores[name]
        },
        getGameStore: (name, initialState) => {
            if (stores[name] == null) {
                stores[name] = createQuickGameStore(name, initialState)
            }
            return stores[name]
        }
    })
}

const initColyseusClient = (authToken?: string): ColyseusClient =>
    setContext(ColyseusClientSymbol, new ColyseusClient(PUBLIC_COLYSEUS_ENDPOINT, authToken))
export const getColyseusClient = (): ColyseusClient => getContext(ColyseusClientSymbol)
