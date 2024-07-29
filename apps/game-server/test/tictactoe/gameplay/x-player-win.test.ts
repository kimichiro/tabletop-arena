import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'

import { Room as ServerRoom } from '@colyseus/core'
import { ColyseusTestServer, boot } from '@colyseus/testing'
import { ActionMessageName, MatchAskMessageName } from '@tabletop-arena/schema'
import { Room as ClientRoom } from 'colyseus.js'

import appConfig from '../../../src/app.config'
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
        client1.send(MatchAskMessageName)

        colyseus.sdk.auth.token = toJSON({ id: AUTH_USER_102_ID, name: AUTH_USER_102_NAME })
        client2 = await colyseus.connectTo(room)
        client2.send(MatchAskMessageName)

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

    it(`'X' player moves on position 'CC'`, async () => {
        client1.send(ActionMessageName, { role: 'X', position: 'CC' })

        await room.waitForMessage(ActionMessageName)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                actions: expect.arrayContaining([
                    { position: 'TL', role: 'O' },
                    { position: 'TC', role: 'O' },
                    { position: 'TR', role: 'O' },
                    { position: 'CL', role: 'O' },
                    { position: 'CR', role: 'O' },
                    { position: 'BL', role: 'O' },
                    { position: 'BC', role: 'O' },
                    { position: 'BR', role: 'O' }
                ]),
                table: {
                    CC: 'X'
                }
            },
            currentTurn: expect.objectContaining({ role: 'O' }),
            moves: expect.arrayContaining([
                { notation: 'CC', action: expect.objectContaining({ position: 'CC', role: 'X' }) }
            ])
        })
    })

    it(`'O' player moves on position 'TC'`, async () => {
        client2.send(ActionMessageName, { role: 'O', position: 'TC' })

        await room.waitForMessage(ActionMessageName)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                actions: expect.arrayContaining([
                    { position: 'TL', role: 'X' },
                    { position: 'TR', role: 'X' },
                    { position: 'CL', role: 'X' },
                    { position: 'CR', role: 'X' },
                    { position: 'BL', role: 'X' },
                    { position: 'BC', role: 'X' },
                    { position: 'BR', role: 'X' }
                ]),
                table: {
                    CC: 'X',
                    TC: 'O'
                }
            },
            currentTurn: expect.objectContaining({ role: 'X' }),
            moves: expect.arrayContaining([
                { notation: 'CC', action: expect.objectContaining({ position: 'CC', role: 'X' }) },
                { notation: 'TC', action: expect.objectContaining({ position: 'TC', role: 'O' }) }
            ])
        })
    })

    it(`'X' player moves on position 'TL'`, async () => {
        client1.send(ActionMessageName, { role: 'X', position: 'TL' })

        await room.waitForMessage(ActionMessageName)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                actions: expect.arrayContaining([
                    { position: 'TR', role: 'O' },
                    { position: 'CL', role: 'O' },
                    { position: 'CR', role: 'O' },
                    { position: 'BL', role: 'O' },
                    { position: 'BC', role: 'O' },
                    { position: 'BR', role: 'O' }
                ]),
                table: {
                    CC: 'X',
                    TC: 'O',
                    TL: 'X'
                }
            },
            currentTurn: expect.objectContaining({ role: 'O' }),
            moves: expect.arrayContaining([
                { notation: 'CC', action: expect.objectContaining({ position: 'CC', role: 'X' }) },
                { notation: 'TC', action: expect.objectContaining({ position: 'TC', role: 'O' }) },
                { notation: 'TL', action: expect.objectContaining({ position: 'TL', role: 'X' }) }
            ])
        })
    })

    it(`'O' player moves on position 'BR'`, async () => {
        client2.send(ActionMessageName, { role: 'O', position: 'BR' })

        await room.waitForMessage(ActionMessageName)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                actions: expect.arrayContaining([
                    { position: 'TR', role: 'X' },
                    { position: 'CL', role: 'X' },
                    { position: 'CR', role: 'X' },
                    { position: 'BL', role: 'X' },
                    { position: 'BC', role: 'X' }
                ]),
                table: {
                    CC: 'X',
                    TC: 'O',
                    TL: 'X',
                    BR: 'O'
                }
            },
            currentTurn: expect.objectContaining({ role: 'X' }),
            moves: expect.arrayContaining([
                { notation: 'CC', action: expect.objectContaining({ position: 'CC', role: 'X' }) },
                { notation: 'TC', action: expect.objectContaining({ position: 'TC', role: 'O' }) },
                { notation: 'TL', action: expect.objectContaining({ position: 'TL', role: 'X' }) },
                { notation: 'BR', action: expect.objectContaining({ position: 'BR', role: 'O' }) }
            ])
        })
    })

    it(`'X' player moves on position 'BL'`, async () => {
        client1.send(ActionMessageName, { role: 'X', position: 'BL' })

        await room.waitForMessage(ActionMessageName)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                actions: expect.arrayContaining([
                    { position: 'TR', role: 'O' },
                    { position: 'CL', role: 'O' },
                    { position: 'CR', role: 'O' },
                    { position: 'BC', role: 'O' }
                ]),
                table: {
                    CC: 'X',
                    TC: 'O',
                    TL: 'X',
                    BR: 'O',
                    BL: 'X'
                }
            },
            currentTurn: expect.objectContaining({ role: 'O' }),
            moves: expect.arrayContaining([
                { notation: 'CC', action: expect.objectContaining({ position: 'CC', role: 'X' }) },
                { notation: 'TC', action: expect.objectContaining({ position: 'TC', role: 'O' }) },
                { notation: 'TL', action: expect.objectContaining({ position: 'TL', role: 'X' }) },
                { notation: 'BR', action: expect.objectContaining({ position: 'BR', role: 'O' }) },
                { notation: 'BL', action: expect.objectContaining({ position: 'BL', role: 'X' }) }
            ])
        })
    })

    it(`'O' player moves on position 'TR'`, async () => {
        client2.send(ActionMessageName, { role: 'O', position: 'TR' })

        await room.waitForMessage(ActionMessageName)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                actions: expect.arrayContaining([
                    { position: 'CL', role: 'X' },
                    { position: 'CR', role: 'X' },
                    { position: 'BC', role: 'X' }
                ]),
                table: {
                    CC: 'X',
                    TC: 'O',
                    TL: 'X',
                    BR: 'O',
                    BL: 'X',
                    TR: 'O'
                }
            },
            currentTurn: expect.objectContaining({ role: 'X' }),
            moves: expect.arrayContaining([
                { notation: 'CC', action: expect.objectContaining({ position: 'CC', role: 'X' }) },
                { notation: 'TC', action: expect.objectContaining({ position: 'TC', role: 'O' }) },
                { notation: 'TL', action: expect.objectContaining({ position: 'TL', role: 'X' }) },
                { notation: 'BR', action: expect.objectContaining({ position: 'BR', role: 'O' }) },
                { notation: 'BL', action: expect.objectContaining({ position: 'BL', role: 'X' }) },
                { notation: 'TR', action: expect.objectContaining({ position: 'TR', role: 'O' }) }
            ])
        })
    })

    it(`'X' player moves on position 'CL'`, async () => {
        client1.send(ActionMessageName, { role: 'X', position: 'CL' })

        await room.waitForMessage(ActionMessageName)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                actions: [],
                table: {
                    CC: 'X',
                    TC: 'O',
                    TL: 'X',
                    BR: 'O',
                    BL: 'X',
                    TR: 'O',
                    CL: 'X'
                }
            },
            moves: expect.arrayContaining([
                { notation: 'CC', action: expect.objectContaining({ position: 'CC', role: 'X' }) },
                { notation: 'TC', action: expect.objectContaining({ position: 'TC', role: 'O' }) },
                { notation: 'TL', action: expect.objectContaining({ position: 'TL', role: 'X' }) },
                { notation: 'BR', action: expect.objectContaining({ position: 'BR', role: 'O' }) },
                { notation: 'BL', action: expect.objectContaining({ position: 'BL', role: 'X' }) },
                { notation: 'TR', action: expect.objectContaining({ position: 'TR', role: 'O' }) },
                { notation: 'CL', action: expect.objectContaining({ position: 'CL', role: 'X' }) }
            ]),
            result: {
                draw: false,
                winner: expect.arrayContaining([expect.objectContaining({ role: 'X' })])
            }
        })
    })
})
