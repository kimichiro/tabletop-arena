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

const USER_102_ID = `102`
const USER_102_NAME = `user102`

describe(`TicTacToe / match-making / two players joined`, () => {
    let colyseus: ColyseusTestServer
    let room: ServerRoom
    let client1: ClientRoom
    let client2: ClientRoom

    beforeAll(async () => {
        colyseus = await boot(appConfig)
    })
    afterAll(async () => {
        await colyseus.shutdown()
    })

    it(`game server creates room for ${ROOM_NAME}`, async () => {
        room = await colyseus.createRoom(ROOM_NAME, { foo: 111 })

        expect(room.roomName).toStrictEqual(ROOM_NAME)
        expect(room.maxClients).toStrictEqual(ROOM_MAX_CLIENTS)
    })

    it(`first player connects to the room`, async () => {
        colyseus.sdk.auth.token = Buffer.from(JSON.stringify({ id: USER_101_ID, name: USER_101_NAME })).toString('base64')
        client1 = await colyseus.connectTo(room)

        expect(client1.sessionId).toStrictEqual(room.clients[0].sessionId)
    })

    it(`first player recieves first state`, async () => {
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

    it(`second player connects to the room`, async () => {
        colyseus.sdk.auth.token = Buffer.from(JSON.stringify({ id: USER_102_ID, name: USER_102_NAME })).toString('base64')
        client2 = await colyseus.connectTo(room)

        expect(client2.sessionId).toStrictEqual(room.clients[1].sessionId)
    })

    it(`second player recieves first state`, async () => {
        await room.waitForNextPatch()

        expect(client2.state.toJSON()).toStrictEqual({
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

    it(`second player send 'match-ask'`, async () => {
        client2.send(MatchAskMessageType, {})

        await room.waitForMessage(MatchAskMessageType)
        await room.waitForNextPatch()

        expect(client2.state.toJSON()).toMatchObject({
            area: {
                actions: expect.arrayContaining([
                    { position:  'a1', role: 'X' },
                    { position:  'a2', role: 'X' },
                    { position:  'a3', role: 'X' },
                    { position:  'b1', role: 'X' },
                    { position:  'b2', role: 'X' },
                    { position:  'b3', role: 'X' },
                    { position:  'c1', role: 'X' },
                    { position:  'c2', role: 'X' },
                    { position:  'c3', role: 'X' }
                ]),
                table: {}
            },
            currentTurn: {
                connection: {
                    status: 'online'
                },
                id: expect.any(String),
                name: expect.any(String),
                remainingTime: {
                    asMilliseconds: 30000,
                    minutes: 0,
                    seconds: 30
                },
                role: expect.any(String),
                userId: expect.any(String)
            },
            moves: [],
            participants: expect.arrayContaining([
                {
                    connection: {
                        status: 'online'
                    },
                    id: expect.any(String),
                    name: expect.any(String),
                    remainingTime: {
                        asMilliseconds: 30000,
                        minutes: 0,
                        seconds: 30
                    },
                    role: expect.any(String),
                    userId: expect.any(String)
                },
                {
                    connection: {
                        status: 'online'
                    },
                    id: expect.any(String),
                    name: expect.any(String),
                    remainingTime: {
                        asMilliseconds: 30000,
                        minutes: 0,
                        seconds: 30
                    },
                    role: expect.any(String),
                    userId: expect.any(String)
                },
            ]),
            result: {}
        })
    })
})
