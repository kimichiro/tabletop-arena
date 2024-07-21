import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'

import { Room as ServerRoom } from '@colyseus/core'
import { ColyseusTestServer, boot } from '@colyseus/testing'
import { Room as ClientRoom } from 'colyseus.js'

import appConfig from '../../../src/app.config'
import { MatchAskMessageType } from '../../../src/rooms/turn-based-match'

const ROOM_NAME = `tictactoe`
const ROOM_MAX_CLIENTS = 2

const USER_101_ID = `101`
const USER_101_NAME = `user101`

describe(`TicTacToe / match-making / single player joined`, () => {
    let colyseus: ColyseusTestServer
    let room: ServerRoom
    let client1: ClientRoom

    beforeAll(async () => {
        colyseus = await boot(appConfig)
    })
    afterAll(async () => {
        await colyseus.shutdown()
    })

    it(`game server creates room for ${ROOM_NAME}`, async () => {
        room = await colyseus.createRoom(ROOM_NAME, {})

        expect(room.roomName).toStrictEqual(ROOM_NAME)
        expect(room.maxClients).toStrictEqual(ROOM_MAX_CLIENTS)
    })

    it(`game client connects to the room`, async () => {
        colyseus.sdk.auth.token = Buffer.from(JSON.stringify({ id: USER_101_ID, name: USER_101_NAME })).toString('base64')
        client1 = await colyseus.connectTo(room)

        expect(client1.sessionId).toStrictEqual(room.clients[0].sessionId)
    })

    it(`game client recieves first state`, async () => {
        await room.waitForNextPatch()

        expect(client1.state.toJSON()).toStrictEqual({
            area: {
                actions: [],
                table: {}
            },
            currentTurn: {},
            moves: [],
            participants: [],
            result: {}
        })
    })

    it(`first player send 'match-ask'`, async () => {
        client1.send(MatchAskMessageType, {})

        await room.waitForMessage(MatchAskMessageType)
        await room.waitForNextPatch()

        expect(client1.state.toJSON()).toStrictEqual({
            area: {
                actions: [],
                table: {}
            },
            currentTurn: {},
            moves: [],
            participants: [],
            result: {}
        })
    })
})
