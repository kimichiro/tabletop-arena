import 'reflect-metadata'

import { monitor } from '@colyseus/monitor'
import { playground } from '@colyseus/playground'
import { default as config } from '@colyseus/tools'
import TicTacToeEngine from '@tabletop-arena/tictactoe'
import { container } from 'tsyringe'

import { QuickMatch } from './rooms/quick-match'

export default config({
    initializeGameServer: (gameServer) => {
        /**
         * Define your room handlers:
         */

        container.register('tictactoe', TicTacToeEngine)
        gameServer.define('tictactoe', QuickMatch)
    },

    initializeExpress: (app) => {
        /**
         * Bind your custom express routes here:
         * Read more: https://expressjs.com/en/starter/basic-routing.html
         */
        app.get('/version', (req, res) => {
            const { name, version } = require('../package.json')
            res.json({ name, version })
        })

        /**
         * Use @colyseus/playground
         * (It is not recommended to expose this route in a production environment)
         */
        if (process.env.NODE_ENV !== 'production') {
            app.use('/', playground)
        }

        /**
         * Use @colyseus/monitor
         * It is recommended to protect this route with a password
         * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
         */
        app.use('/colyseus', monitor())
    },

    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
})
