import { cli, Options } from '@colyseus/loadtest'

import { run as runTicTacToe } from './tic-tac-toe'

export async function loadtest(options: Options) {
    switch (options.roomName) {
        case 'tictactoe': {
            await runTicTacToe(options)
            break
        }
        default:
            throw new Error('Invalid room name')
    }
}

cli(loadtest)
