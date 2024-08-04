import { Client } from '@colyseus/core'
import {
    Identity,
    IdentitySchema,
    TurnBasedAction,
    TurnBasedArea,
    TurnBasedMove,
    TurnBasedPlayer,
    TurnBasedResult,
    TurnBasedStateSchema,
    TurnBasedSummary,
    UnknownClientError
} from '@tabletop-arena/schema'

import { IdToken } from '../auth'
import { CountdownTimer } from './game-clock'
import { GameSettings, GameEngine } from './game-engine'

const TURN_BASED_TIMEOUT_INITIAL = 30000
const TURN_BASED_TIMEOUT_ADD_DEFAULT = 20000
const TURN_BASED_TIMEOUT_ADD_MINIMUM = 10000

export abstract class TurnBasedEngine<
    Area extends TurnBasedArea = TurnBasedArea,
    Action extends TurnBasedAction = TurnBasedAction,
    Player extends TurnBasedPlayer = TurnBasedPlayer,
    Move extends TurnBasedMove = TurnBasedMove,
    Result extends TurnBasedResult = TurnBasedResult,
    Summary extends TurnBasedSummary<Move, Result> = TurnBasedSummary<Move, Result>,
    Settings extends GameSettings = GameSettings
> extends GameEngine<TurnBasedStateSchema<Area, Action, Player, Move, Result, Summary>, Settings> {
    #timers: Map<Player, CountdownTimer> = new Map<Player, CountdownTimer>()
    #currentTurn: Player | null = null

    validate(): void {
        this.validateTurn()
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
            newPlayer.remainingTime = oldPlayer.remainingTime
            newPlayer.isCurrentTurn = oldPlayer.isCurrentTurn

            this.disposeCountdownTimer(oldPlayer)
        }

        this.createCountdownTimer(newPlayer, oldPlayer == null)

        newPlayer.connection.status = 'online'
    }

    protected onDisconnect(client: Client): void {
        const player = this.state.players.find(({ id }) => id === client.sessionId)
        if (player != null) {
            player.connection.status = 'offline'
        }
    }

    protected onReconnect(client: Client): void {
        const player = this.state.players.find(({ id }) => id === client.sessionId)
        if (player != null) {
            player.connection.status = 'online'
        }
    }

    protected onAction(client: Client, payload: object): boolean {
        const player = this.state.players.find(({ id }) => id === client.sessionId)
        if (player == null) {
            throw new UnknownClientError()
        }

        this.onMove(player, payload)

        const isEnded = this.state.summary.result != null
        if (isEnded) {
            const spectators = this.state.players.map(
                ({ id, name, userId }) => new IdentitySchema({ id, name, userId })
            )
            this.state.spectators.unshift(...spectators)
        }

        return isEnded
    }

    protected onDispose(): void {
        Array.from(this.#timers.values()).forEach((timer) => timer.clear())
        this.#timers.clear()
    }

    protected abstract onJoin(identity: Identity, existing: Player | null): Player

    protected abstract onMove(player: Player, payload: object): void

    private validateTurn(): void {
        const currentTurn = this.state.players.find(({ isCurrentTurn }) => isCurrentTurn) ?? null
        if (this.#currentTurn !== currentTurn) {
            if (this.#currentTurn != null) {
                this.pauseCountdownTimer(this.#currentTurn)
            }
            this.#currentTurn = currentTurn
            if (this.#currentTurn != null) {
                this.resumeCountdownTimer(this.#currentTurn)
            }
        }
    }

    private createCountdownTimer(player: Player, reset: boolean): void {
        const timer = this.clock.createCountdownTimer(
            reset ? TURN_BASED_TIMEOUT_INITIAL : player.remainingTime.asMilliseconds,
            ({ minutes, seconds, asMilliseconds }) => {
                player.remainingTime.minutes = minutes
                player.remainingTime.seconds = seconds
                player.remainingTime.asMilliseconds = asMilliseconds
            }
        )
        this.#timers.set(player, timer)

        player.remainingTime.minutes = timer.minutes
        player.remainingTime.seconds = timer.seconds
        player.remainingTime.asMilliseconds = timer.asMilliseconds

        this.#timers.set(player, timer)
    }

    private resumeCountdownTimer(player: Player): void {
        const timer = this.#timers.get(player)
        if (timer != null) {
            timer.resume()

            player.remainingTime.minutes = timer.minutes
            player.remainingTime.seconds = timer.seconds
            player.remainingTime.asMilliseconds = timer.asMilliseconds
        }
    }

    private pauseCountdownTimer(player: Player): void {
        const timer = this.#timers.get(player)
        if (timer != null) {
            timer.pause()

            const regainTimeout =
                timer.asMilliseconds > TURN_BASED_TIMEOUT_INITIAL
                    ? TURN_BASED_TIMEOUT_ADD_MINIMUM
                    : TURN_BASED_TIMEOUT_ADD_DEFAULT
            timer.increase(regainTimeout)

            player.remainingTime.minutes = timer.minutes
            player.remainingTime.seconds = timer.seconds
            player.remainingTime.asMilliseconds = timer.asMilliseconds
        }
    }

    private disposeCountdownTimer(player: Player): void {
        this.#timers.get(player)?.clear()
        this.#timers.delete(player)
    }
}
