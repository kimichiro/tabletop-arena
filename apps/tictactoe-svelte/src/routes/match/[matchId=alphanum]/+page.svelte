<script lang="ts">
    import './+page.css'

    import { onMount } from 'svelte'

    import { createInitialState, Position, Role } from '@tabletop-arena/game-schema'
    import type { TicTacToeState } from '@tabletop-arena/game-schema'

    import { goto } from '$app/navigation'
    import { PUBLIC_TICTACTOE_ROOM_NAME } from '$env/static/public'
    import { initGameContext } from '$lib/context/game-context'

    import type { PageData } from './$types'

    export let data: PageData

    const gameContext = initGameContext<TicTacToeState>({ authToken: data.gameToken })
    const gameStore = gameContext.getGameStore(PUBLIC_TICTACTOE_ROOM_NAME, createInitialState())

    const onCellAction = (position: Position) => {
        const { state } = $gameStore
        const action = state.actions.find((action) => action.position === position)
        if (action != null) {
            gameStore.sendAction(action)
        }
    }

    const isCellActionable = (position: Position) => {
        const { roomId, state } = $gameStore
        return (
            roomId != null &&
            state.area.global.cells.get(position) == null &&
            state.actions.some((action) => action.position === position)
        )
    }

    const onToHome = () => {
        goto('/')
    }

    const onPlayAgain = async () => {
        await gameStore.leaveMatch()

        goto('/match')
    }

    const cellTopLeftAction = onCellAction.bind(null, Position.TopLeft)
    const cellCenterLeftAction = onCellAction.bind(null, Position.CenterLeft)
    const cellBottomLeftAction = onCellAction.bind(null, Position.BottomLeft)
    const cellTopCenterAction = onCellAction.bind(null, Position.TopCenter)
    const cellCenterCenterAction = onCellAction.bind(null, Position.CenterCenter)
    const cellBottomCenterAction = onCellAction.bind(null, Position.BottomCenter)
    const cellTopRightAction = onCellAction.bind(null, Position.TopRight)
    const cellCenterRightAction = onCellAction.bind(null, Position.CenterRight)
    const cellBottomRightAction = onCellAction.bind(null, Position.BottomRight)

    onMount(() => {
        // TODO: display error page with button to home page
        gameStore.findMatch(data.matchId).catch((error) => {
            console.error(error)
            goto('/')
        })
    })

    $: area = $gameStore.state.area
    $: players = $gameStore.state.players
    $: currentTurn = players.find(({ isCurrentTurn }) => isCurrentTurn) ?? null
    $: result = $gameStore.state.summary.result

    $: userSessionId = $gameStore.sessionId
    $: currentPlayer = players.find(({ id }) => id === userSessionId)

    $: indicatorTitle = ' '
    $: timerMinutes = currentPlayer?.remainingTime.minutes ?? 0
    $: timerSeconds = currentPlayer?.remainingTime.seconds ?? 0

    $: playerEx = players.find(({ role }) => role === Role.Ex)
    $: playerOh = players.find(({ role }) => role === Role.Oh)

    $: cellTopLeftMark = area.global.cells.get(Position.TopLeft) ?? ' '
    $: cellCenterLeftMark = area.global.cells.get(Position.CenterLeft) ?? ' '
    $: cellBottomLeftMark = area.global.cells.get(Position.BottomLeft) ?? ' '
    $: cellTopCenterMark = area.global.cells.get(Position.TopCenter) ?? ' '
    $: cellCenterCenterMark = area.global.cells.get(Position.CenterCenter) ?? ' '
    $: cellBottomCenterMark = area.global.cells.get(Position.BottomCenter) ?? ' '
    $: cellTopRightMark = area.global.cells.get(Position.TopRight) ?? ' '
    $: cellCenterRightMark = area.global.cells.get(Position.CenterRight) ?? ' '
    $: cellBottomRightMark = area.global.cells.get(Position.BottomRight) ?? ' '

    $: cellTopLeftActionable = false
    $: cellCenterLeftActionable = false
    $: cellBottomLeftActionable = false
    $: cellTopCenterActionable = false
    $: cellCenterCenterActionable = false
    $: cellBottomCenterActionable = false
    $: cellTopRightActionable = false
    $: cellCenterRightActionable = false
    $: cellBottomRightActionable = false

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
        } else if (result?.winner?.at(0)?.id != null && userSessionId != null) {
            if (result?.winner?.at(0)?.id === userSessionId) {
                indicatorTitle = `You Won!`
            } else {
                indicatorTitle = `You Lose!`
            }
        }

        cellTopLeftActionable = isCellActionable(Position.TopLeft)
        cellCenterLeftActionable = isCellActionable(Position.CenterLeft)
        cellBottomLeftActionable = isCellActionable(Position.BottomLeft)
        cellTopCenterActionable = isCellActionable(Position.TopCenter)
        cellCenterCenterActionable = isCellActionable(Position.CenterCenter)
        cellBottomCenterActionable = isCellActionable(Position.BottomCenter)
        cellTopRightActionable = isCellActionable(Position.TopRight)
        cellCenterRightActionable = isCellActionable(Position.CenterRight)
        cellBottomRightActionable = isCellActionable(Position.BottomRight)
    }
</script>

<div>
    <div class="absolute top-8 left-8">
        <article class="prose lg:prose-xl">
            <button on:click={onToHome}><h2>eX-Oh!</h2></button>
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
                class:actionable={cellTopLeftActionable}
                class:roleEx={cellTopLeftMark === Role.Ex}
                class:roleOh={cellTopLeftMark === Role.Oh}
                on:click={cellTopLeftAction}
            >
                {cellTopLeftMark}
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
            <div
                class="cell"
                class:actionable={cellCenterLeftActionable}
                class:roleEx={cellCenterLeftMark === Role.Ex}
                class:roleOh={cellCenterLeftMark === Role.Oh}
                on:click={cellCenterLeftAction}
            >
                {cellCenterLeftMark}
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
            <div
                class="cell"
                class:actionable={cellBottomLeftActionable}
                class:roleEx={cellBottomLeftMark === Role.Ex}
                class:roleOh={cellBottomLeftMark === Role.Oh}
                on:click={cellBottomLeftAction}
            >
                {cellBottomLeftMark}
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
            <div
                class="cell"
                class:actionable={cellTopCenterActionable}
                class:roleEx={cellTopCenterMark === Role.Ex}
                class:roleOh={cellTopCenterMark === Role.Oh}
                on:click={cellTopCenterAction}
            >
                {cellTopCenterMark}
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
            <div
                class="cell"
                class:actionable={cellCenterCenterActionable}
                class:roleEx={cellCenterCenterMark === Role.Ex}
                class:roleOh={cellCenterCenterMark === Role.Oh}
                on:click={cellCenterCenterAction}
            >
                {cellCenterCenterMark}
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
            <div
                class="cell"
                class:actionable={cellBottomCenterActionable}
                class:roleEx={cellBottomCenterMark === Role.Ex}
                class:roleOh={cellBottomCenterMark === Role.Oh}
                on:click={cellBottomCenterAction}
            >
                {cellBottomCenterMark}
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
            <div
                class="cell"
                class:actionable={cellTopRightActionable}
                class:roleEx={cellTopRightMark === Role.Ex}
                class:roleOh={cellTopRightMark === Role.Oh}
                on:click={cellTopRightAction}
            >
                {cellTopRightMark}
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
            <div
                class="cell"
                class:actionable={cellCenterRightActionable}
                class:roleEx={cellCenterRightMark === Role.Ex}
                class:roleOh={cellCenterRightMark === Role.Oh}
                on:click={cellCenterRightAction}
            >
                {cellCenterRightMark}
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
            <div
                class="cell"
                class:actionable={cellBottomRightActionable}
                class:roleEx={cellBottomRightMark === Role.Ex}
                class:roleOh={cellBottomRightMark === Role.Oh}
                on:click={cellBottomRightAction}
            >
                {cellBottomRightMark}
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
