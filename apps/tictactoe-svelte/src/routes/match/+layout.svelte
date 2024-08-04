<script lang="ts">
    import { createInitialState } from '@tabletop-arena/game-schema'
    import type { TicTacToeState } from '@tabletop-arena/game-schema'

    import { beforeNavigate } from '$app/navigation'
    import { PUBLIC_TICTACTOE_ROOM_NAME } from '$env/static/public'
    import { initGameContext } from '$lib/context/game-context'

    import type { PageData } from './$types'

    export let data: PageData

    const gameContext = initGameContext<TicTacToeState>({ authToken: data.gameToken })
    const gameStore = gameContext.getGameStore(PUBLIC_TICTACTOE_ROOM_NAME, createInitialState())

    beforeNavigate(async ({ to }) => {
        if (to == null || !to.url.pathname.startsWith('/match')) {
            await gameStore.leaveMatch()
        }
    })
</script>

<slot />
