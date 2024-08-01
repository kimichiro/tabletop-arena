import { Client } from 'colyseus.js'

import { QuickMatch } from './quick-match'

export class ColyseusClient {
    private readonly client: Client

    constructor(endpoint: string, authToken?: string) {
        this.client = new Client(endpoint)

        if (authToken != null) {
            this.client.auth.token = authToken
        }
    }

    async findMatch<State>(name: string): Promise<QuickMatch<State>> {
        const room = await this.client.joinOrCreate<State>(name)
        return new QuickMatch(this.client, room)
    }

    async joinMatch<State>(roomId: string): Promise<QuickMatch<State>> {
        const room = await this.client.joinById<State>(roomId)
        return new QuickMatch(this.client, room)
    }
}
