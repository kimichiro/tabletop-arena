import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'

import { Room as ServerRoom } from '@colyseus/core'
import { ColyseusTestServer, boot } from '@colyseus/testing'
import { ActionMessageName } from '@tabletop-arena/game-client/schema'
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
        room = await colyseus.createRoom(ROOM_NAME, { seating: 'fifo' })

        colyseus.sdk.auth.token = toJSON({ id: AUTH_USER_101_ID, name: AUTH_USER_101_NAME })
        client1 = await colyseus.connectTo(room)

        colyseus.sdk.auth.token = toJSON({ id: AUTH_USER_102_ID, name: AUTH_USER_102_NAME })
        client2 = await colyseus.connectTo(room)

        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                scorecards: expect.arrayContaining([
                    {
                        userId: expect.any(String),
                        playing: true,
                        role: 'X'
                    },
                    {
                        userId: expect.any(String),
                        playing: false,
                        role: 'O'
                    }
                ]),
                board: {
                    cells: {}
                }
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
                    id: expect.any(String),
                    name: expect.any(String),
                    userId: expect.any(String),
                    self: true,
                    connection: 'online',
                    role: 'X',
                    timeout: {
                        asMilliseconds: 30000,
                        minutes: 0,
                        seconds: 30
                    }
                },
                {
                    id: expect.any(String),
                    name: expect.any(String),
                    userId: expect.any(String),
                    self: true,
                    connection: 'online',
                    role: 'O',
                    timeout: {
                        asMilliseconds: 30000,
                        minutes: 0,
                        seconds: 30
                    }
                }
            ]),
            moves: [],
            status: {
                ended: false,
                draw: false
            }
        })
    })

    it(`'X' player moves on position 'CC'`, async () => {
        client1.send(ActionMessageName, { role: 'X', position: 'CC' })

        await room.waitForMessage(ActionMessageName)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                scorecards: expect.arrayContaining([
                    {
                        userId: expect.any(String),
                        playing: false,
                        role: 'X'
                    },
                    {
                        userId: expect.any(String),
                        playing: true,
                        role: 'O'
                    }
                ]),
                board: {
                    cells: {
                        CC: 'X'
                    }
                }
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
            moves: expect.arrayContaining([
                { notation: 'CC', action: expect.objectContaining({ position: 'CC', role: 'X' }) }
            ]),
            status: {
                ended: false,
                draw: false
            }
        })
    })

    it(`'O' player moves on position 'TC'`, async () => {
        client2.send(ActionMessageName, { role: 'O', position: 'TC' })

        await room.waitForMessage(ActionMessageName)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                scorecards: expect.arrayContaining([
                    {
                        userId: expect.any(String),
                        playing: true,
                        role: 'X'
                    },
                    {
                        userId: expect.any(String),
                        playing: false,
                        role: 'O'
                    }
                ]),
                board: {
                    cells: {
                        CC: 'X',
                        TC: 'O'
                    }
                }
            },
            actions: expect.arrayContaining([
                { position: 'TL', role: 'X' },
                { position: 'TR', role: 'X' },
                { position: 'CL', role: 'X' },
                { position: 'CR', role: 'X' },
                { position: 'BL', role: 'X' },
                { position: 'BC', role: 'X' },
                { position: 'BR', role: 'X' }
            ]),
            moves: expect.arrayContaining([
                { notation: 'CC', action: expect.objectContaining({ position: 'CC', role: 'X' }) },
                { notation: 'TC', action: expect.objectContaining({ position: 'TC', role: 'O' }) }
            ]),
            status: {
                ended: false,
                draw: false
            }
        })
    })

    it(`'X' player moves on position 'TL'`, async () => {
        client1.send(ActionMessageName, { role: 'X', position: 'TL' })

        await room.waitForMessage(ActionMessageName)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                scorecards: expect.arrayContaining([
                    {
                        userId: expect.any(String),
                        playing: false,
                        role: 'X'
                    },
                    {
                        userId: expect.any(String),
                        playing: true,
                        role: 'O'
                    }
                ]),
                board: {
                    cells: {
                        CC: 'X',
                        TC: 'O',
                        TL: 'X'
                    }
                }
            },
            actions: expect.arrayContaining([
                { position: 'TR', role: 'O' },
                { position: 'CL', role: 'O' },
                { position: 'CR', role: 'O' },
                { position: 'BL', role: 'O' },
                { position: 'BC', role: 'O' },
                { position: 'BR', role: 'O' }
            ]),
            moves: expect.arrayContaining([
                { notation: 'CC', action: expect.objectContaining({ position: 'CC', role: 'X' }) },
                { notation: 'TC', action: expect.objectContaining({ position: 'TC', role: 'O' }) },
                { notation: 'TL', action: expect.objectContaining({ position: 'TL', role: 'X' }) }
            ]),
            status: {
                ended: false,
                draw: false
            }
        })
    })

    it(`'O' player moves on position 'BR'`, async () => {
        client2.send(ActionMessageName, { role: 'O', position: 'BR' })

        await room.waitForMessage(ActionMessageName)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                scorecards: expect.arrayContaining([
                    {
                        userId: expect.any(String),
                        playing: true,
                        role: 'X'
                    },
                    {
                        userId: expect.any(String),
                        playing: false,
                        role: 'O'
                    }
                ]),
                board: {
                    cells: {
                        CC: 'X',
                        TC: 'O',
                        TL: 'X',
                        BR: 'O'
                    }
                }
            },
            actions: expect.arrayContaining([
                { position: 'TR', role: 'X' },
                { position: 'CL', role: 'X' },
                { position: 'CR', role: 'X' },
                { position: 'BL', role: 'X' },
                { position: 'BC', role: 'X' }
            ]),
            moves: expect.arrayContaining([
                { notation: 'CC', action: expect.objectContaining({ position: 'CC', role: 'X' }) },
                { notation: 'TC', action: expect.objectContaining({ position: 'TC', role: 'O' }) },
                { notation: 'TL', action: expect.objectContaining({ position: 'TL', role: 'X' }) },
                { notation: 'BR', action: expect.objectContaining({ position: 'BR', role: 'O' }) }
            ]),
            status: {
                ended: false,
                draw: false
            }
        })
    })

    it(`'X' player moves on position 'BL'`, async () => {
        client1.send(ActionMessageName, { role: 'X', position: 'BL' })

        await room.waitForMessage(ActionMessageName)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                scorecards: expect.arrayContaining([
                    {
                        userId: expect.any(String),
                        playing: false,
                        role: 'X'
                    },
                    {
                        userId: expect.any(String),
                        playing: true,
                        role: 'O'
                    }
                ]),
                board: {
                    cells: {
                        CC: 'X',
                        TC: 'O',
                        TL: 'X',
                        BR: 'O',
                        BL: 'X'
                    }
                }
            },
            actions: expect.arrayContaining([
                { position: 'TR', role: 'O' },
                { position: 'CL', role: 'O' },
                { position: 'CR', role: 'O' },
                { position: 'BC', role: 'O' }
            ]),
            moves: expect.arrayContaining([
                { notation: 'CC', action: expect.objectContaining({ position: 'CC', role: 'X' }) },
                { notation: 'TC', action: expect.objectContaining({ position: 'TC', role: 'O' }) },
                { notation: 'TL', action: expect.objectContaining({ position: 'TL', role: 'X' }) },
                { notation: 'BR', action: expect.objectContaining({ position: 'BR', role: 'O' }) },
                { notation: 'BL', action: expect.objectContaining({ position: 'BL', role: 'X' }) }
            ]),
            status: {
                ended: false,
                draw: false
            }
        })
    })

    it(`'O' player moves on position 'TR'`, async () => {
        client2.send(ActionMessageName, { role: 'O', position: 'TR' })

        await room.waitForMessage(ActionMessageName)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                scorecards: expect.arrayContaining([
                    {
                        userId: expect.any(String),
                        playing: true,
                        role: 'X'
                    },
                    {
                        userId: expect.any(String),
                        playing: false,
                        role: 'O'
                    }
                ]),
                board: {
                    cells: {
                        CC: 'X',
                        TC: 'O',
                        TL: 'X',
                        BR: 'O',
                        BL: 'X',
                        TR: 'O'
                    }
                }
            },
            actions: expect.arrayContaining([
                { position: 'CL', role: 'X' },
                { position: 'CR', role: 'X' },
                { position: 'BC', role: 'X' }
            ]),
            moves: expect.arrayContaining([
                { notation: 'CC', action: expect.objectContaining({ position: 'CC', role: 'X' }) },
                { notation: 'TC', action: expect.objectContaining({ position: 'TC', role: 'O' }) },
                { notation: 'TL', action: expect.objectContaining({ position: 'TL', role: 'X' }) },
                { notation: 'BR', action: expect.objectContaining({ position: 'BR', role: 'O' }) },
                { notation: 'BL', action: expect.objectContaining({ position: 'BL', role: 'X' }) },
                { notation: 'TR', action: expect.objectContaining({ position: 'TR', role: 'O' }) }
            ]),
            status: {
                ended: false,
                draw: false
            }
        })
    })

    it(`'X' player moves on position 'CL'`, async () => {
        client1.send(ActionMessageName, { role: 'X', position: 'CL' })

        await room.waitForMessage(ActionMessageName)
        await room.waitForNextPatch()

        expect(room.state.toJSON()).toMatchObject({
            area: {
                scorecards: expect.arrayContaining([
                    {
                        userId: expect.any(String),
                        playing: false,
                        role: 'X'
                    },
                    {
                        userId: expect.any(String),
                        playing: false,
                        role: 'O'
                    }
                ]),
                board: {
                    cells: {
                        CC: 'X',
                        TC: 'O',
                        TL: 'X',
                        BR: 'O',
                        BL: 'X',
                        TR: 'O',
                        CL: 'X'
                    }
                }
            },
            actions: [],
            moves: expect.arrayContaining([
                { notation: 'CC', action: expect.objectContaining({ position: 'CC', role: 'X' }) },
                { notation: 'TC', action: expect.objectContaining({ position: 'TC', role: 'O' }) },
                { notation: 'TL', action: expect.objectContaining({ position: 'TL', role: 'X' }) },
                { notation: 'BR', action: expect.objectContaining({ position: 'BR', role: 'O' }) },
                { notation: 'BL', action: expect.objectContaining({ position: 'BL', role: 'X' }) },
                { notation: 'TR', action: expect.objectContaining({ position: 'TR', role: 'O' }) },
                { notation: 'CL', action: expect.objectContaining({ position: 'CL', role: 'X' }) }
            ]),
            status: {
                ended: true,
                draw: false,
                winners: expect.arrayContaining([
                    {
                        id: expect.any(String),
                        name: expect.any(String),
                        userId: '101',
                        self: true,
                        connection: 'unknown'
                    }
                ])
            }
        })
    })
})
