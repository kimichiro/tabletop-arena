import { Room } from '@colyseus/core'
import { Schema } from '@colyseus/schema'
import { constructor } from 'tsyringe/dist/typings/types'

import { GameEngine } from '../engines/game-engine'
import { QuickMatch } from '../rooms/quick-match'
import { TicTacToeEngine } from './tictactoe/engine'

interface Game {
    name: string
    room: constructor<Room>
    engine: constructor<GameEngine<Schema, object>>
}

export default [
    {
        name: 'tictactoe',
        room: QuickMatch,
        engine: TicTacToeEngine
    }
] as Game[]
