import { Client } from '@colyseus/core'
import {
    ClientIdentity,
    IdentitySchema,
    TurnBasedAction,
    TurnBasedArea,
    TurnBasedMove,
    TurnBasedPlayer,
    TurnBasedStatus,
    TurnBasedScorecard,
    TurnBasedStateSchema,
    UnknownClientError
} from '@tabletop-arena/game-engine'

import { IdToken } from '../auth'
import { CountdownTimer } from './game-clock'
import { GameSettings, GameEngine } from './game-engine'

const TURN_BASED_TIMEOUT_INITIAL = 30000
const TURN_BASED_TIMEOUT_ADD_DEFAULT = 20000
const TURN_BASED_TIMEOUT_ADD_MINIMUM = 10000

export abstract class TurnBasedEngine<
    Area extends TurnBasedArea<Scorecard>,
    Action extends TurnBasedAction,
    Scorecard extends TurnBasedScorecard = TurnBasedScorecard,
    Player extends TurnBasedPlayer = TurnBasedPlayer,
    Move extends TurnBasedMove = TurnBasedMove,
    Result extends TurnBasedStatus = TurnBasedStatus,
    Settings extends GameSettings = GameSettings
> extends GameEngine<TurnBasedStateSchema<Area, Action, Scorecard, Player, Move, Result>, Settings> {
    #timers: Map<Player, CountdownTimer> = new Map<Player, CountdownTimer>()

    validate(): void {
        this.validateTimers()
    }

    protected onConnect(client: Client, idToken: IdToken): void {
        const playerIndex = this.state.players.findIndex(({ userId }) => userId === idToken.id)
        if (playerIndex === -1) {
            // reject different user from joining in-progress game room
            if (this.ready || this.started) {
                client.leave()
                return
            }
        }

        const oldPlayer = playerIndex === -1 ? null : this.state.players[playerIndex]
        const newPlayer = this.onJoin(
            {
                id: client.sessionId,
                name: idToken.name,
                userId: idToken.id
            },
            oldPlayer
        )
        if (playerIndex !== -1) {
            this.state.players.splice(playerIndex, 1)
        }
        this.state.players.push(newPlayer)

        if (oldPlayer != null) {
            newPlayer.connection = oldPlayer.connection
            newPlayer.timeout = oldPlayer.timeout

            this.disposeCountdownTimer(oldPlayer)
        }

        this.createCountdownTimer(newPlayer, oldPlayer == null)

        newPlayer.connection = 'online'
    }

    protected onDisconnect(client: Client): void {
        const player = this.state.players.find(({ id }) => id === client.sessionId)
        if (player != null) {
            player.connection = 'offline'
        }
    }

    protected onReconnect(client: Client): void {
        const player = this.state.players.find(({ id }) => id === client.sessionId)
        if (player != null) {
            player.connection = 'online'
        }
    }

    protected onAction(client: Client, payload: object): boolean {
        const player = this.state.players.find(({ id }) => id === client.sessionId)
        if (player == null) {
            throw new UnknownClientError()
        }

        this.onMove(player, payload)

        if (this.state.status.ended) {
            const spectators = this.state.players.map(
                ({ id, name, userId }) => new IdentitySchema({ id, name, userId })
            )
            this.state.spectators.unshift(...spectators)
        }

        return this.state.status.ended
    }

    protected onDispose(): void {
        Array.from(this.#timers.values()).forEach((timer) => timer.clear())
        this.#timers.clear()
    }

    protected abstract onJoin(identity: ClientIdentity, existing: Player | null): Player

    protected abstract onMove(player: Player, payload: object): void

    private validateTimers(): void {
        if (!this.started) {
            return
        }

        Array.from(this.#timers.entries()).forEach(([player, timer]) => {
            const scorecard = this.state.area.scorecards.find(({ userId }) => userId === player.userId)
            if (scorecard == null) {
                timer.pause()
                return
            }

            if (scorecard.playing) {
                timer.resume()
            } else if (!timer.paused) {
                timer.pause()

                const regainTimeout =
                    timer.asMilliseconds > TURN_BASED_TIMEOUT_INITIAL
                        ? TURN_BASED_TIMEOUT_ADD_MINIMUM
                        : TURN_BASED_TIMEOUT_ADD_DEFAULT
                timer.increase(regainTimeout)
            }

            player.timeout.minutes = timer.minutes
            player.timeout.seconds = timer.seconds
            player.timeout.asMilliseconds = timer.asMilliseconds
        })
    }

    private createCountdownTimer(player: Player, reset: boolean): void {
        const timer = this.clock.createCountdownTimer(
            reset ? TURN_BASED_TIMEOUT_INITIAL : player.timeout.asMilliseconds,
            ({ minutes, seconds, asMilliseconds }) => {
                player.timeout.minutes = minutes
                player.timeout.seconds = seconds
                player.timeout.asMilliseconds = asMilliseconds
            }
        )
        this.#timers.set(player, timer)

        player.timeout.minutes = timer.minutes
        player.timeout.seconds = timer.seconds
        player.timeout.asMilliseconds = timer.asMilliseconds

        this.#timers.set(player, timer)
    }

    private disposeCountdownTimer(player: Player): void {
        this.#timers.get(player)?.clear()
        this.#timers.delete(player)
    }
}
