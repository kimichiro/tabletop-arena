import assert from 'assert'

import { ColyseusTestServer, boot } from '@colyseus/testing'

import appConfig from '../src/app.config'
import { MatchAskMessageType } from '../src/rooms/turn-based-match'

describe(`testing TicTacToe game engine`, () => {
    let colyseus: ColyseusTestServer

    before(async () => (colyseus = await boot(appConfig)))
    after(async () => colyseus.shutdown())

    beforeEach(async () => await colyseus.cleanup())
    afterEach(() => {
        colyseus.sdk.auth.token = ''
    })

    it(`a user connects to a room`, async () => {
        colyseus.sdk.auth.token = Buffer.from(JSON.stringify({ id: '101', name: 'user101' })).toString('base64')

        // `room` is the server-side Room instance reference.
        const room = await colyseus.createRoom('tictactoe', {})

        // `client1` is the client-side `Room` instance reference (same as JavaScript SDK)
        const client1 = await colyseus.connectTo(room)

        // make your assertions
        assert.strictEqual(client1.sessionId, room.clients[0].sessionId)

        // wait for state sync
        await room.waitForNextPatch()

        assert.deepStrictEqual(
            {
                area: {
                    actions: [],
                    table: {}
                },
                currentTurn: {},
                moves: [],
                participants: [],
                result: {}
            },
            client1.state.toJSON()
        )
    })

    it(`two users connect to a room and make a match`, async () => {
        colyseus.sdk.auth.token = Buffer.from(JSON.stringify({ id: '101', name: 'user101' })).toString('base64')

        const room = await colyseus.createRoom('tictactoe', {})

        const client1 = await colyseus.connectTo(room)
        const client2 = await colyseus.connectTo(room)

        assert.strictEqual(client1.sessionId, room.clients[0].sessionId)
        assert.strictEqual(client2.sessionId, room.clients[1].sessionId)

        await room.waitForNextPatch()

        assert.deepStrictEqual(
            {
                area: {
                    actions: [],
                    table: {}
                },
                currentTurn: {},
                moves: [],
                participants: [],
                result: {}
            },
            client1.state.toJSON()
        )

        client1.send(MatchAskMessageType, {})
        client2.send(MatchAskMessageType, {})

        await room.waitForMessage(MatchAskMessageType)

        await room.waitForNextPatch()
    })
})
