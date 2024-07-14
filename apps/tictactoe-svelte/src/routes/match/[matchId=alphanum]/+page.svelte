<script lang="ts">
    import './+page.css'

    import { onMount } from 'svelte'

    import { beforeNavigate, goto } from '$app/navigation'
    import { initGameContext } from '$lib/context/game-context'
    import { Position, Role } from '$lib/game/schema/tictactoe'
    import type { GameState } from '$lib/game/schema/tictactoe'

    import type { PageData } from './$types'

    export let data: PageData

    const gameContext = initGameContext<GameState>({ authToken: data.gameToken })
    const gameStore = gameContext.getStore('tictactoe', {
        area: { table: {}, actions: [] },
        participants: [],
        currentTurn: null,
        moves: [],
        result: null
    })

    const onCellAction = (position: Position) => {
        const { state } = $gameStore
        const action = state.area.actions.find((action) => action.position === position)

        if (action != null) {
            gameStore.sendMove(action)
        }
    }

    const isCellActionable = (position: Position) => {
        const { roomId, state } = $gameStore
        return (
            roomId != null &&
            state.area?.table?.[position] == null &&
            state.area?.actions?.some((action) => action.position === position)
        )
    }

    const onPlayAgain = () => {
        goto('/match')
    }

    const cellA1Action = onCellAction.bind(null, Position.A1)
    const cellB1Action = onCellAction.bind(null, Position.B1)
    const cellC1Action = onCellAction.bind(null, Position.C1)
    const cellA2Action = onCellAction.bind(null, Position.A2)
    const cellB2Action = onCellAction.bind(null, Position.B2)
    const cellC2Action = onCellAction.bind(null, Position.C2)
    const cellA3Action = onCellAction.bind(null, Position.A3)
    const cellB3Action = onCellAction.bind(null, Position.B3)
    const cellC3Action = onCellAction.bind(null, Position.C3)

    onMount(async () => {
        await gameStore.findMatch(data.matchId)

        const { roomId } = $gameStore
        if (roomId == null) {
            goto('/')
        }
    })

    beforeNavigate(async () => {
        await gameStore.leaveMatch()
    })

    $: area = $gameStore.state.area
    $: players = $gameStore.state.participants
    $: currentTurn = $gameStore.state.currentTurn
    $: result = $gameStore.state.result

    $: userSessionId = $gameStore.sessionId
    $: currentPlayer = players.find(({ id }) => id === userSessionId)

    $: indicatorTitle = ' '
    $: timerMinutes = currentPlayer?.remainingTime.minutes ?? 0
    $: timerSeconds = currentPlayer?.remainingTime.seconds ?? 0

    $: playerEx = players.find(({ role }) => role === Role.Ex)
    $: playerOh = players.find(({ role }) => role === Role.Oh)

    $: cellA1Mark = area?.table?.[Position.A1] ?? ' '
    $: cellB1Mark = area?.table?.[Position.B1] ?? ' '
    $: cellC1Mark = area?.table?.[Position.C1] ?? ' '
    $: cellA2Mark = area?.table?.[Position.A2] ?? ' '
    $: cellB2Mark = area?.table?.[Position.B2] ?? ' '
    $: cellC2Mark = area?.table?.[Position.C2] ?? ' '
    $: cellA3Mark = area?.table?.[Position.A3] ?? ' '
    $: cellB3Mark = area?.table?.[Position.B3] ?? ' '
    $: cellC3Mark = area?.table?.[Position.C3] ?? ' '

    $: cellA1Actionable = false
    $: cellB1Actionable = false
    $: cellC1Actionable = false
    $: cellA2Actionable = false
    $: cellB2Actionable = false
    $: cellC2Actionable = false
    $: cellA3Actionable = false
    $: cellB3Actionable = false
    $: cellC3Actionable = false

    $: isYourTurn = currentTurn?.id != null && currentTurn.id === userSessionId
    $: isGameEnded = result?.draw != null || result?.winner != null

    $: {
        indicatorTitle = ' '
        if (currentTurn?.id != null && userSessionId != null) {
            if (currentTurn.id === userSessionId) {
                indicatorTitle = `Your Turn!`
            } else {
                indicatorTitle = `Opponent's Turn!`
            }
        } else if (result?.draw === true) {
            indicatorTitle = `Draw!`
        } else if (result?.winner?.id != null && userSessionId != null) {
            if (result.winner.id === userSessionId) {
                indicatorTitle = `You Won!`
            } else {
                indicatorTitle = `You Lose!`
            }
        }

        cellA1Actionable = isCellActionable(Position.A1)
        cellB1Actionable = isCellActionable(Position.B1)
        cellC1Actionable = isCellActionable(Position.C1)
        cellA2Actionable = isCellActionable(Position.A2)
        cellB2Actionable = isCellActionable(Position.B2)
        cellC2Actionable = isCellActionable(Position.C2)
        cellA3Actionable = isCellActionable(Position.A3)
        cellB3Actionable = isCellActionable(Position.B3)
        cellC3Actionable = isCellActionable(Position.C3)
    }
</script>

<div>
    <div class="absolute top-8 left-8">
        <article class="prose lg:prose-xl">
            <h2>eX-Oh!</h2>
        </article>
    </div>

    <div class="component-container">
        <div class="indicator-bar">
            <div class="timer-clock" class:invisible={!isYourTurn} class:opacity-0={!isYourTurn}>
                <div class="timer-digit" class:exceed={timerSeconds < 0}>
                    <span class="countdown text-5xl">
                        <span class="flex-initial" style={`--value:${Math.abs(timerMinutes)};`}></span>
                    </span>
                    min
                </div>
                <div class="timer-digit" class:exceed={timerSeconds < 0}>
                    <span class="countdown text-5xl">
                        <span class="flex-initial" style={`--value:${Math.abs(timerSeconds)};`}></span>
                    </span>
                    sec
                </div>
            </div>
            <article class="prose lg:prose-xl">
                <h1>{indicatorTitle}</h1>
            </article>
            <button class="btn btn-active btn-neutral btn-wide" class:invisible={!isGameEnded} on:click={onPlayAgain}>
                Play Again
            </button>
        </div>
        <div class="area-table">
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
            <div
                class="cell"
                class:actionable={cellA1Actionable}
                class:roleEx={cellA1Mark === Role.Ex}
                class:roleOh={cellA1Mark === Role.Oh}
                on:click={cellA1Action}
            >
                {cellA1Mark}
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
            <div
                class="cell"
                class:actionable={cellB1Actionable}
                class:roleEx={cellB1Mark === Role.Ex}
                class:roleOh={cellB1Mark === Role.Oh}
                on:click={cellB1Action}
            >
                {cellB1Mark}
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
            <div
                class="cell"
                class:actionable={cellC1Actionable}
                class:roleEx={cellC1Mark === Role.Ex}
                class:roleOh={cellC1Mark === Role.Oh}
                on:click={cellC1Action}
            >
                {cellC1Mark}
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
            <div
                class="cell"
                class:actionable={cellA2Actionable}
                class:roleEx={cellA2Mark === Role.Ex}
                class:roleOh={cellA2Mark === Role.Oh}
                on:click={cellA2Action}
            >
                {cellA2Mark}
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
            <div
                class="cell"
                class:actionable={cellB2Actionable}
                class:roleEx={cellB2Mark === Role.Ex}
                class:roleOh={cellB2Mark === Role.Oh}
                on:click={cellB2Action}
            >
                {cellB2Mark}
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
            <div
                class="cell"
                class:actionable={cellC2Actionable}
                class:roleEx={cellC2Mark === Role.Ex}
                class:roleOh={cellC2Mark === Role.Oh}
                on:click={cellC2Action}
            >
                {cellC2Mark}
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
            <div
                class="cell"
                class:actionable={cellA3Actionable}
                class:roleEx={cellA3Mark === Role.Ex}
                class:roleOh={cellA3Mark === Role.Oh}
                on:click={cellA3Action}
            >
                {cellA3Mark}
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
            <div
                class="cell"
                class:actionable={cellB3Actionable}
                class:roleEx={cellB3Mark === Role.Ex}
                class:roleOh={cellB3Mark === Role.Oh}
                on:click={cellB3Action}
            >
                {cellB3Mark}
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
            <div
                class="cell"
                class:actionable={cellC3Actionable}
                class:roleEx={cellC3Mark === Role.Ex}
                class:roleOh={cellC3Mark === Role.Oh}
                on:click={cellC3Action}
            >
                {cellC3Mark}
            </div>
        </div>
        <div class="score-board">
            <div
                class="player-card"
                class:current-turn={playerEx != null && playerEx?.id === currentTurn?.id}
                class:me={playerEx?.id === userSessionId}
            >
                <div class="player-label">
                    <div class="name">{playerEx?.name ?? ''}</div>
                    <div class="role roleEx">X</div>
                </div>
            </div>
            <div class="divider divider-horizontal">VS</div>
            <div
                class="player-card"
                class:current-turn={playerOh != null && playerOh?.id === currentTurn?.id}
                class:me={playerOh?.id === userSessionId}
            >
                <div class="player-label">
                    <div class="name">{playerOh?.name ?? ''}</div>
                    <div class="role roleOh">O</div>
                </div>
            </div>
        </div>
    </div>
</div>
