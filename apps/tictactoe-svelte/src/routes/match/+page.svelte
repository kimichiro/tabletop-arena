<script lang="ts">
    import { onMount } from 'svelte'

    import { createInitialState } from '@tabletop-arena/game-schema'
    import type { TicTacToeState } from '@tabletop-arena/game-schema'

    import { goto } from '$app/navigation'
    import { PUBLIC_TICTACTOE_ROOM_NAME } from '$env/static/public'
    import BlobLoader from '$lib/component/BlobLoader.svelte'
    import CenterContainer from '$lib/component/CenterContainer.svelte'
    import { initGameContext } from '$lib/context/game-context'

    import type { PageData } from './$types'

    export let data: PageData

    const gameContext = initGameContext<TicTacToeState>({ authToken: data.gameToken })
    const gameStore = gameContext.getGameStore(PUBLIC_TICTACTOE_ROOM_NAME, createInitialState())

    onMount(() => {
        // TODO: display error page with button to home page
        gameStore.findMatch().catch(() => goto('/'))

        const unsubscribe = gameStore.subscribe(async ({ roomId, started }) => {
            if (roomId != null && started) {
                goto(`/match/${roomId}`)
            }
        })

        return () => unsubscribe()
    })
</script>

<CenterContainer>
    <article class="prose lg:prose-xl">
        <h2>Finding opponent...</h2>
        <div class="not-prose">
            <div class="flex gap-4 items-center justify-center h-16">
                <BlobLoader />
            </div>
        </div>
    </article>
</CenterContainer>
