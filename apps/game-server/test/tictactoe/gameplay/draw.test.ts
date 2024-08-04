import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'

import { Room as ServerRoom } from '@colyseus/core'
import { ColyseusTestServer, boot } from '@colyseus/testing'
import { ActionMessageName } from '@tabletop-arena/schema'
import { Room as ClientRoom } from 'colyseus.js'

import appConfig from '../../../src/app.config'
import { AUTH_USER_101_ID, AUTH_USER_101_NAME, AUTH_USER_102_ID, AUTH_USER_102_NAME, toJSON } from '../../auth'
import { ROOM_NAME } from '../game-config'

describe(`TicTacToe / gameplay / draw`, () => {
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
        room = await colyseus.createRoom(ROOM_NAME, { seating: 'fifo' })

        colyseus.sdk.auth.token = toJSON({ id: AUTH_USER_101_ID, name: AUTH_USER_101_NAME })
        client1 = await colyseus.connectTo(room)

        colyseus.sdk.auth.token = toJSON({ id: AUTH_USER_102_ID, name: AUTH_USER_102_NAME })
        client2 = await colyseus.connectTo(room)

        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                global: {
                    cells: {}
                },
                players: {}
            },
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
                    role: 'X',
                    userId: expect.any(String)
                },
                {
                    connection: {
                        status: 'online'
                    },
                    id: expect.any(String),
                    isCurrentTurn: false,
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
            summary: {
                moves: []
            }
        })
    })

    it(`'X' player moves on position 'CC'`, async () => {
        client1.send(ActionMessageName, { role: 'X', position: 'CC' })

        await room.waitForMessage(ActionMessageName)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                global: {
                    cells: {
                        CC: 'X'
                    }
                },
                players: {}
            },
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
            summary: {
                moves: expect.arrayContaining([
                    { notation: 'CC', action: expect.objectContaining({ position: 'CC', role: 'X' }) }
                ])
            }
        })
    })

    it(`'O' player moves on position 'TR'`, async () => {
        client2.send(ActionMessageName, { role: 'O', position: 'TR' })

        await room.waitForMessage(ActionMessageName)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                global: {
                    cells: {
                        CC: 'X',
                        TR: 'O'
                    }
                },
                players: {}
            },
            actions: expect.arrayContaining([
                { position: 'TL', role: 'X' },
                { position: 'TC', role: 'X' },
                { position: 'CL', role: 'X' },
                { position: 'CR', role: 'X' },
                { position: 'BL', role: 'X' },
                { position: 'BC', role: 'X' },
                { position: 'BR', role: 'X' }
            ]),
            summary: {
                moves: expect.arrayContaining([
                    { notation: 'CC', action: expect.objectContaining({ position: 'CC', role: 'X' }) },
                    { notation: 'TR', action: expect.objectContaining({ position: 'TR', role: 'O' }) }
                ])
            }
        })
    })

    it(`'X' player moves on position 'TL'`, async () => {
        client1.send(ActionMessageName, { role: 'X', position: 'TL' })

        await room.waitForMessage(ActionMessageName)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                global: {
                    cells: {
                        CC: 'X',
                        TR: 'O',
                        TL: 'X'
                    }
                },
                players: {}
            },
            actions: expect.arrayContaining([
                { position: 'TC', role: 'O' },
                { position: 'CL', role: 'O' },
                { position: 'CR', role: 'O' },
                { position: 'BL', role: 'O' },
                { position: 'BC', role: 'O' },
                { position: 'BR', role: 'O' }
            ]),
            summary: {
                moves: expect.arrayContaining([
                    { notation: 'CC', action: expect.objectContaining({ position: 'CC', role: 'X' }) },
                    { notation: 'TR', action: expect.objectContaining({ position: 'TR', role: 'O' }) },
                    { notation: 'TL', action: expect.objectContaining({ position: 'TL', role: 'X' }) }
                ])
            }
        })
    })

    it(`'O' player moves on position 'BR'`, async () => {
        client2.send(ActionMessageName, { role: 'O', position: 'BR' })

        await room.waitForMessage(ActionMessageName)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                global: {
                    cells: {
                        CC: 'X',
                        TR: 'O',
                        TL: 'X',
                        BR: 'O'
                    }
                },
                players: {}
            },
            actions: expect.arrayContaining([
                { position: 'TC', role: 'X' },
                { position: 'CL', role: 'X' },
                { position: 'CR', role: 'X' },
                { position: 'BL', role: 'X' },
                { position: 'BC', role: 'X' }
            ]),
            summary: {
                moves: expect.arrayContaining([
                    { notation: 'CC', action: expect.objectContaining({ position: 'CC', role: 'X' }) },
                    { notation: 'TR', action: expect.objectContaining({ position: 'TR', role: 'O' }) },
                    { notation: 'TL', action: expect.objectContaining({ position: 'TL', role: 'X' }) },
                    { notation: 'BR', action: expect.objectContaining({ position: 'BR', role: 'O' }) }
                ])
            }
        })
    })

    it(`'X' player moves on position 'CR'`, async () => {
        client1.send(ActionMessageName, { role: 'X', position: 'CR' })

        await room.waitForMessage(ActionMessageName)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                global: {
                    cells: {
                        CC: 'X',
                        TR: 'O',
                        TL: 'X',
                        BR: 'O',
                        CR: 'X'
                    }
                },
                players: {}
            },
            actions: expect.arrayContaining([
                { position: 'TC', role: 'O' },
                { position: 'CL', role: 'O' },
                { position: 'BL', role: 'O' },
                { position: 'BC', role: 'O' }
            ]),
            summary: {
                moves: expect.arrayContaining([
                    { notation: 'CC', action: expect.objectContaining({ position: 'CC', role: 'X' }) },
                    { notation: 'TR', action: expect.objectContaining({ position: 'TR', role: 'O' }) },
                    { notation: 'TL', action: expect.objectContaining({ position: 'TL', role: 'X' }) },
                    { notation: 'BR', action: expect.objectContaining({ position: 'BR', role: 'O' }) },
                    { notation: 'CR', action: expect.objectContaining({ position: 'CR', role: 'X' }) }
                ])
            }
        })
    })

    it(`'O' player moves on position 'CL'`, async () => {
        client2.send(ActionMessageName, { role: 'O', position: 'CL' })

        await room.waitForMessage(ActionMessageName)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                global: {
                    cells: {
                        CC: 'X',
                        TR: 'O',
                        TL: 'X',
                        BR: 'O',
                        CR: 'X',
                        CL: 'O'
                    }
                },
                players: {}
            },
            actions: expect.arrayContaining([
                { position: 'TC', role: 'X' },
                { position: 'BL', role: 'X' },
                { position: 'BC', role: 'X' }
            ]),
            summary: {
                moves: expect.arrayContaining([
                    { notation: 'CC', action: expect.objectContaining({ position: 'CC', role: 'X' }) },
                    { notation: 'TR', action: expect.objectContaining({ position: 'TR', role: 'O' }) },
                    { notation: 'TL', action: expect.objectContaining({ position: 'TL', role: 'X' }) },
                    { notation: 'BR', action: expect.objectContaining({ position: 'BR', role: 'O' }) },
                    { notation: 'CR', action: expect.objectContaining({ position: 'CR', role: 'X' }) },
                    { notation: 'CL', action: expect.objectContaining({ position: 'CL', role: 'O' }) }
                ])
            }
        })
    })

    it(`'X' player moves on position 'BC'`, async () => {
        client1.send(ActionMessageName, { role: 'X', position: 'BC' })

        await room.waitForMessage(ActionMessageName)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                global: {
                    cells: {
                        CC: 'X',
                        TR: 'O',
                        TL: 'X',
                        BR: 'O',
                        CR: 'X',
                        CL: 'O',
                        BC: 'X'
                    }
                },
                players: {}
            },
            actions: expect.arrayContaining([
                { position: 'TC', role: 'O' },
                { position: 'BL', role: 'O' }
            ]),
            summary: {
                moves: expect.arrayContaining([
                    { notation: 'CC', action: expect.objectContaining({ position: 'CC', role: 'X' }) },
                    { notation: 'TR', action: expect.objectContaining({ position: 'TR', role: 'O' }) },
                    { notation: 'TL', action: expect.objectContaining({ position: 'TL', role: 'X' }) },
                    { notation: 'BR', action: expect.objectContaining({ position: 'BR', role: 'O' }) },
                    { notation: 'CR', action: expect.objectContaining({ position: 'CR', role: 'X' }) },
                    { notation: 'CL', action: expect.objectContaining({ position: 'CL', role: 'O' }) },
                    { notation: 'BC', action: expect.objectContaining({ position: 'BC', role: 'X' }) }
                ])
            }
        })
    })

    it(`'O' player moves on position 'TC'`, async () => {
        client2.send(ActionMessageName, { role: 'O', position: 'TC' })

        await room.waitForMessage(ActionMessageName)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                global: {
                    cells: {
                        CC: 'X',
                        TR: 'O',
                        TL: 'X',
                        BR: 'O',
                        CR: 'X',
                        CL: 'O',
                        BC: 'X',
                        TC: 'O'
                    }
                },
                players: {}
            },
            actions: [],
            summary: {
                moves: expect.arrayContaining([
                    { notation: 'CC', action: expect.objectContaining({ position: 'CC', role: 'X' }) },
                    { notation: 'TR', action: expect.objectContaining({ position: 'TR', role: 'O' }) },
                    { notation: 'TL', action: expect.objectContaining({ position: 'TL', role: 'X' }) },
                    { notation: 'BR', action: expect.objectContaining({ position: 'BR', role: 'O' }) },
                    { notation: 'CR', action: expect.objectContaining({ position: 'CR', role: 'X' }) },
                    { notation: 'CL', action: expect.objectContaining({ position: 'CL', role: 'O' }) },
                    { notation: 'BC', action: expect.objectContaining({ position: 'BC', role: 'X' }) },
                    { notation: 'TC', action: expect.objectContaining({ position: 'TC', role: 'O' }) }
                ]),
                result: {
                    draw: true
                }
            }
        })
    })
})
