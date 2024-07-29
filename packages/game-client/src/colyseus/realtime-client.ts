import { Client } from 'colyseus.js'

import { RealtimeMatch } from './realtime-match'

export class RealtimeClient {
    private readonly client: Client

    constructor(endpoint: string, authToken?: string) {
        this.client = new Client(endpoint)

        if (authToken != null) {
            this.client.auth.token = authToken
        }
    }

    async findMatch<State>(name: string): Promise<RealtimeMatch<State>> {
        const room = await this.client.joinOrCreate<State>(name)
        return new RealtimeMatch(this.client, room)
    }

    async joinMatch<State>(roomId: string): Promise<RealtimeMatch<State>> {
        const room = await this.client.joinById<State>(roomId)
        return new RealtimeMatch(this.client, room)
    }
}
