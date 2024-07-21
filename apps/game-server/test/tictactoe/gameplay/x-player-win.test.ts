import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'

import { Room as ServerRoom } from '@colyseus/core'
import { ColyseusTestServer, boot } from '@colyseus/testing'
import { Room as ClientRoom } from 'colyseus.js'

import appConfig from '../../../src/app.config'
import { GameMoveMessageType, MatchAskMessageType } from '../../../src/rooms/turn-based-match'
import { AUTH_USER_101_ID, AUTH_USER_101_NAME, AUTH_USER_102_ID, AUTH_USER_102_NAME, toJSON } from '../../auth'
import { ROOM_NAME } from '../game-config'

describe(`TicTacToe / gameplay / x-player win`, () => {
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
                    { position: 'a1', role: 'X' },
                    { position: 'a2', role: 'X' },
                    { position: 'a3', role: 'X' },
                    { position: 'b1', role: 'X' },
                    { position: 'b2', role: 'X' },
                    { position: 'b3', role: 'X' },
                    { position: 'c1', role: 'X' },
                    { position: 'c2', role: 'X' },
                    { position: 'c3', role: 'X' }
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

    it(`'X' player moves on position 'b2'`, async () => {
        client1.send(GameMoveMessageType, {
            action: { role: 'X', position: 'b2' }
        })

        await room.waitForMessage(GameMoveMessageType)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                actions: expect.arrayContaining([
                    { position: 'a1', role: 'O' },
                    { position: 'a2', role: 'O' },
                    { position: 'a3', role: 'O' },
                    { position: 'b1', role: 'O' },
                    { position: 'b3', role: 'O' },
                    { position: 'c1', role: 'O' },
                    { position: 'c2', role: 'O' },
                    { position: 'c3', role: 'O' }
                ]),
                table: {
                    b2: 'X'
                }
            },
            currentTurn: expect.objectContaining({ role: 'O' }),
            moves: expect.arrayContaining([{ notation: 'b2', participant: expect.objectContaining({ role: 'X' }) }])
        })
    })

    it(`'O' player moves on position 'a2'`, async () => {
        client2.send(GameMoveMessageType, {
            action: { role: 'O', position: 'a2' }
        })

        await room.waitForMessage(GameMoveMessageType)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                actions: expect.arrayContaining([
                    { position: 'a1', role: 'X' },
                    { position: 'a3', role: 'X' },
                    { position: 'b1', role: 'X' },
                    { position: 'b3', role: 'X' },
                    { position: 'c1', role: 'X' },
                    { position: 'c2', role: 'X' },
                    { position: 'c3', role: 'X' }
                ]),
                table: {
                    b2: 'X',
                    a2: 'O'
                }
            },
            currentTurn: expect.objectContaining({ role: 'X' }),
            moves: expect.arrayContaining([
                { notation: 'b2', participant: expect.objectContaining({ role: 'X' }) },
                { notation: 'a2', participant: expect.objectContaining({ role: 'O' }) }
            ])
        })
    })

    it(`'X' player moves on position 'a1'`, async () => {
        client1.send(GameMoveMessageType, {
            action: { role: 'X', position: 'a1' }
        })

        await room.waitForMessage(GameMoveMessageType)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                actions: expect.arrayContaining([
                    { position: 'a3', role: 'O' },
                    { position: 'b1', role: 'O' },
                    { position: 'b3', role: 'O' },
                    { position: 'c1', role: 'O' },
                    { position: 'c2', role: 'O' },
                    { position: 'c3', role: 'O' }
                ]),
                table: {
                    b2: 'X',
                    a2: 'O',
                    a1: 'X'
                }
            },
            currentTurn: expect.objectContaining({ role: 'O' }),
            moves: expect.arrayContaining([
                { notation: 'b2', participant: expect.objectContaining({ role: 'X' }) },
                { notation: 'a2', participant: expect.objectContaining({ role: 'O' }) },
                { notation: 'a1', participant: expect.objectContaining({ role: 'X' }) }
            ])
        })
    })

    it(`'O' player moves on position 'c3'`, async () => {
        client2.send(GameMoveMessageType, {
            action: { role: 'O', position: 'c3' }
        })

        await room.waitForMessage(GameMoveMessageType)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                actions: expect.arrayContaining([
                    { position: 'a3', role: 'X' },
                    { position: 'b1', role: 'X' },
                    { position: 'b3', role: 'X' },
                    { position: 'c1', role: 'X' },
                    { position: 'c2', role: 'X' }
                ]),
                table: {
                    b2: 'X',
                    a2: 'O',
                    a1: 'X',
                    c3: 'O'
                }
            },
            currentTurn: expect.objectContaining({ role: 'X' }),
            moves: expect.arrayContaining([
                { notation: 'b2', participant: expect.objectContaining({ role: 'X' }) },
                { notation: 'a2', participant: expect.objectContaining({ role: 'O' }) },
                { notation: 'a1', participant: expect.objectContaining({ role: 'X' }) },
                { notation: 'c3', participant: expect.objectContaining({ role: 'O' }) }
            ])
        })
    })

    it(`'X' player moves on position 'c1'`, async () => {
        client1.send(GameMoveMessageType, {
            action: { role: 'X', position: 'c1' }
        })

        await room.waitForMessage(GameMoveMessageType)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                actions: expect.arrayContaining([
                    { position: 'a3', role: 'O' },
                    { position: 'b1', role: 'O' },
                    { position: 'b3', role: 'O' },
                    { position: 'c2', role: 'O' }
                ]),
                table: {
                    b2: 'X',
                    a2: 'O',
                    a1: 'X',
                    c3: 'O',
                    c1: 'X'
                }
            },
            currentTurn: expect.objectContaining({ role: 'O' }),
            moves: expect.arrayContaining([
                { notation: 'b2', participant: expect.objectContaining({ role: 'X' }) },
                { notation: 'a2', participant: expect.objectContaining({ role: 'O' }) },
                { notation: 'a1', participant: expect.objectContaining({ role: 'X' }) },
                { notation: 'c3', participant: expect.objectContaining({ role: 'O' }) },
                { notation: 'c1', participant: expect.objectContaining({ role: 'X' }) }
            ])
        })
    })

    it(`'O' player moves on position 'a3'`, async () => {
        client2.send(GameMoveMessageType, {
            action: { role: 'O', position: 'a3' }
        })

        await room.waitForMessage(GameMoveMessageType)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                actions: expect.arrayContaining([
                    { position: 'b1', role: 'X' },
                    { position: 'b3', role: 'X' },
                    { position: 'c2', role: 'X' }
                ]),
                table: {
                    b2: 'X',
                    a2: 'O',
                    a1: 'X',
                    c3: 'O',
                    c1: 'X',
                    a3: 'O'
                }
            },
            currentTurn: expect.objectContaining({ role: 'X' }),
            moves: expect.arrayContaining([
                { notation: 'b2', participant: expect.objectContaining({ role: 'X' }) },
                { notation: 'a2', participant: expect.objectContaining({ role: 'O' }) },
                { notation: 'a1', participant: expect.objectContaining({ role: 'X' }) },
                { notation: 'c3', participant: expect.objectContaining({ role: 'O' }) },
                { notation: 'c1', participant: expect.objectContaining({ role: 'X' }) },
                { notation: 'a3', participant: expect.objectContaining({ role: 'O' }) }
            ])
        })
    })

    it(`'X' player moves on position 'b1'`, async () => {
        client1.send(GameMoveMessageType, {
            action: { role: 'X', position: 'b1' }
        })

        await room.waitForMessage(GameMoveMessageType)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                actions: [],
                table: {
                    b2: 'X',
                    a2: 'O',
                    a1: 'X',
                    c3: 'O',
                    c1: 'X',
                    a3: 'O',
                    b1: 'X'
                }
            },
            moves: expect.arrayContaining([
                { notation: 'b2', participant: expect.objectContaining({ role: 'X' }) },
                { notation: 'a2', participant: expect.objectContaining({ role: 'O' }) },
                { notation: 'a1', participant: expect.objectContaining({ role: 'X' }) },
                { notation: 'c3', participant: expect.objectContaining({ role: 'O' }) },
                { notation: 'c1', participant: expect.objectContaining({ role: 'X' }) },
                { notation: 'a3', participant: expect.objectContaining({ role: 'O' }) },
                { notation: 'b1', participant: expect.objectContaining({ role: 'X' }) }
            ]),
            result: {
                draw: false,
                winner: expect.objectContaining({ role: 'X' })
            }
        })
    })
})
