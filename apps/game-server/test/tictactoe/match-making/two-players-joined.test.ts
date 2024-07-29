import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'

import { Room as ServerRoom } from '@colyseus/core'
import { ColyseusTestServer, boot } from '@colyseus/testing'
import { MatchAskMessageName } from '@tabletop-arena/schema'
import { Room as ClientRoom } from 'colyseus.js'

import appConfig from '../../../src/app.config'
import { AUTH_USER_101_ID, AUTH_USER_101_NAME, AUTH_USER_102_ID, AUTH_USER_102_NAME, toJSON } from '../../auth'
import { ROOM_MAX_CLIENTS, ROOM_NAME } from '../game-config'

describe(`TicTacToe / match-making / two players joined`, () => {
    let colyseus: ColyseusTestServer
    let room: ServerRoom
    let client1: ClientRoom
    let client2: ClientRoom

    beforeAll(async () => {
        colyseus = await boot(appConfig)
    })
    afterAll(async () => {
        await client1.leave()
        await client2.leave()

        await colyseus.shutdown()
    })

    it(`game server creates room for ${ROOM_NAME}`, async () => {
        room = await colyseus.createRoom(ROOM_NAME, { roleAssignStrategy: 'fifo' })

        expect(room.roomName).toStrictEqual(ROOM_NAME)
        expect(room.maxClients).toStrictEqual(ROOM_MAX_CLIENTS)
    })

    it(`first player connects to the room`, async () => {
        colyseus.sdk.auth.token = toJSON({ id: AUTH_USER_101_ID, name: AUTH_USER_101_NAME })
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
        client1.send(MatchAskMessageName)

        await room.waitForMessage(MatchAskMessageName)
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
        colyseus.sdk.auth.token = toJSON({ id: AUTH_USER_102_ID, name: AUTH_USER_102_NAME })
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
        client2.send(MatchAskMessageName)

        await room.waitForMessage(MatchAskMessageName)
        await room.waitForNextPatch()

        expect(client2.state.toJSON()).toMatchObject({
            area: {
                actions: [],
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
                role: 'X',
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
                    role: 'X',
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
                    role: 'O',
                    userId: expect.any(String)
                }
            ]),
            result: {}
        })
    })

    it(`game server updates to initial state`, async () => {
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                actions: expect.arrayContaining([
                    { position: 'TL', role: 'X' },
                    { position: 'TC', role: 'X' },
                    { position: 'TR', role: 'X' },
                    { position: 'CL', role: 'X' },
                    { position: 'CC', role: 'X' },
                    { position: 'CR', role: 'X' },
                    { position: 'BL', role: 'X' },
                    { position: 'BC', role: 'X' },
                    { position: 'BR', role: 'X' }
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
                role: 'X',
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
                    role: 'X',
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
                    role: 'O',
                    userId: expect.any(String)
                }
            ])
        })
    })
})
