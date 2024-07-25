import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'

import { Room as ServerRoom } from '@colyseus/core'
import { ColyseusTestServer, boot } from '@colyseus/testing'
import { GameMoveErrorMessageType, GameMoveMessageType, MatchAskMessageType } from '@tabletop-arena/schema'
import { Room as ClientRoom } from 'colyseus.js'

import appConfig from '../../../src/app.config'
import { AUTH_USER_101_ID, AUTH_USER_101_NAME, AUTH_USER_102_ID, AUTH_USER_102_NAME, toJSON } from '../../auth'
import { ROOM_NAME } from '../game-config'

describe(`TicTacToe / gameplay / invalid move`, () => {
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

    it(`game server creates a match for ${ROOM_NAME}`, async () => {
        room = await colyseus.createRoom(ROOM_NAME, { roleAssignStrategy: 'fifo' })

        colyseus.sdk.auth.token = toJSON({ id: AUTH_USER_101_ID, name: AUTH_USER_101_NAME })
        client1 = await colyseus.connectTo(room)
        client1.send(MatchAskMessageType, {})

        colyseus.sdk.auth.token = toJSON({ id: AUTH_USER_102_ID, name: AUTH_USER_102_NAME })
        client2 = await colyseus.connectTo(room)
        client2.send(MatchAskMessageType, {})

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

    it(`'X' player moves on invalid position 'x1'`, async () => {
        client1.send(GameMoveMessageType, {
            action: { role: 'X', position: 'x1' }
        })

        await room.waitForMessage(GameMoveMessageType)

        const errorMessage = await client1.waitForMessage(GameMoveErrorMessageType)

        expect(errorMessage).toMatchObject({
            message: 'Invalid move'
        })
    })

    it(`'X' player send invalid move on position 'CC' with role 'O'`, async () => {
        client1.send(GameMoveMessageType, {
            action: { role: 'O', position: 'CC' }
        })

        await room.waitForMessage(GameMoveMessageType)

        const errorMessage = await client1.waitForMessage(GameMoveErrorMessageType)

        expect(errorMessage).toMatchObject({
            message: 'Invalid move'
        })
    })
})
