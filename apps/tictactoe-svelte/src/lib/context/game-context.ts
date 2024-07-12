import { getContext, hasContext, setContext } from 'svelte'

import { PUBLIC_COLYSEUS_ENDPOINT } from '$env/static/public'
import { GameClient } from '$lib/game/game-client'
import { createGameStore, type GameStore } from '$lib/store/game-store'

const GameContextSymbol = Symbol('game-context')
const GameClientSymbol = Symbol('game-client')

interface GameContextOptions {
    authToken?: string
}

export interface GameContext<State> {
    createStore(name: string, initialState: State): GameStore<State>
    getStore(name: string, initialState: State): GameStore<State>
}

export const initGameContext = <State>(options?: GameContextOptions): GameContext<State> => {
    if (hasContext(GameContextSymbol)) {
        const context = getContext<GameContext<State>>(GameContextSymbol)
        return context
    }

    const { authToken } = options ?? {}
    initGameClient(authToken)

    const stores: Record<string, GameStore<State>> = {}

    return setContext(GameContextSymbol, {
        createStore: (name, initialState) => {
            stores[name] = createGameStore(name, initialState)
            return stores[name]
        },
        getStore: (name, initialState) => {
            if (stores[name] == null) {
                stores[name] = createGameStore(name, initialState)
            }
            return stores[name]
        }
    })
}

const initGameClient = (authToken?: string): GameClient =>
    setContext(GameClientSymbol, new GameClient(PUBLIC_COLYSEUS_ENDPOINT, authToken))
export const getGameClient = (): GameClient => getContext(GameClientSymbol)
