import { Room } from '@colyseus/core'
import { Schema } from '@colyseus/schema'
import { constructor } from 'tsyringe/dist/typings/types'

import { GameEngine } from '../engines/game-engine'
import { TurnBasedMatch } from '../rooms/turn-based-match'
import { TicTacToeEngine } from './tictactoe/engine'

interface Game {
    name: string
    room: constructor<Room>
    engine: constructor<GameEngine<Schema, object, object>>
}

export default [
    {
        name: 'tictactoe',
        room: TurnBasedMatch,
        engine: TicTacToeEngine
    }
] as Game[]
