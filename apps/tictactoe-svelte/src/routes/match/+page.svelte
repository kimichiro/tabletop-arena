<script lang="ts">
    import { onMount } from 'svelte'

    import { goto } from '$app/navigation'
    import BlobLoader from '$lib/component/BlobLoader.svelte'
    import CenterContainer from '$lib/component/CenterContainer.svelte'
    import { initGameContext } from '$lib/context/game-context'
    import type { GameState } from '$lib/game/schema/tictactoe'

    import type { PageData } from './$types'

    export let data: PageData

    const gameContext = initGameContext<GameState>({ authToken: data.gameToken })
    const gameStore = gameContext.createStore('tictactoe', {
        area: { table: {}, actions: [] },
        participants: [],
        currentTurn: null,
        moves: [],
        result: null
    })

    onMount(() => {
        gameStore.findMatch()

        const unsubscribe = gameStore.subscribe(async ({ roomId, started }) => {
            if (started) {
                if (roomId != null) {
                    goto(`/match/${roomId}`)
                } else {
                    goto(`/`)
                }
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
