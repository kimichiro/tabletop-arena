import { Client } from 'colyseus.js'

import { GameMatch } from './game-match'

export class GameClient {
    #client: Client

    constructor(endpoint: string, authToken?: string) {
        this.#client = new Client(endpoint)

        if (authToken != null) {
            this.#client.auth.token = authToken
        }
    }

    async findMatch<State>(name: string): Promise<GameMatch<State>> {
        const room = await this.#client.joinOrCreate<State>(name)
        return new GameMatch(this, room)
    }

    async joinMatch<State>(roomId: string): Promise<GameMatch<State>> {
        const room = await this.#client.joinById<State>(roomId)
        return new GameMatch(this, room)
    }

    async reconnect<State>(token: string): Promise<GameMatch<State>> {
        const room = await this.#client.reconnect<State>(token)
        return new GameMatch(this, room)
    }
}
