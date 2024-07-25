import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'

import { Room as ServerRoom } from '@colyseus/core'
import { ColyseusTestServer, boot } from '@colyseus/testing'
import { MatchAskMessageType } from '@tabletop-arena/schema'
import { Room as ClientRoom } from 'colyseus.js'

import appConfig from '../../../src/app.config'
import { AUTH_USER_101_ID, AUTH_USER_101_NAME, toJSON } from '../../auth'
import { ROOM_MAX_CLIENTS, ROOM_NAME } from '../game-config'

describe(`TicTacToe / match-making / single player joined`, () => {
    let colyseus: ColyseusTestServer
    let room: ServerRoom
    let client1: ClientRoom

    beforeAll(async () => {
        colyseus = await boot(appConfig)
    })
    afterAll(async () => {
        await client1.leave()

        await colyseus.shutdown()
    })

    it(`game server creates room for ${ROOM_NAME}`, async () => {
        room = await colyseus.createRoom(ROOM_NAME, { roleAssignStrategy: 'fifo' })

        expect(room.roomName).toStrictEqual(ROOM_NAME)
        expect(room.maxClients).toStrictEqual(ROOM_MAX_CLIENTS)
    })

    it(`game client connects to the room`, async () => {
        colyseus.sdk.auth.token = toJSON({ id: AUTH_USER_101_ID, name: AUTH_USER_101_NAME })
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
