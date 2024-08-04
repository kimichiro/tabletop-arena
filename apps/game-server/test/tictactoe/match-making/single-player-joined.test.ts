import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'

import { Room as ServerRoom } from '@colyseus/core'
import { ColyseusTestServer, boot } from '@colyseus/testing'
import { Room as ClientRoom } from 'colyseus.js'

import appConfig from '../../../src/app.config'
import { AUTH_USER_101_ID, AUTH_USER_101_NAME, toJSON } from '../../auth'
import { ROOM_NAME } from '../game-config'

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
        room = await colyseus.createRoom(ROOM_NAME, { seating: 'fifo' })

        expect(room.roomName).toStrictEqual(ROOM_NAME)
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
                global: {
                    cells: {}
                },
                players: {}
            },
            actions: [],
            players: expect.arrayContaining([
                {
                    connection: {
                        status: 'online'
                    },
                    id: expect.any(String),
                    isCurrentTurn: true,
                    name: expect.any(String),
                    remainingTime: {
                        asMilliseconds: 30000,
                        minutes: 0,
                        seconds: 30
                    },
                    role: expect.any(String),
                    userId: expect.any(String)
                }
            ]),
            spectators: [],
            summary: {
                moves: []
            }
        })
    })
})
