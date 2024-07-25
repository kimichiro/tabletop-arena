<script lang="ts">
    import { onMount } from 'svelte'

    import { ArraySchema, MapSchema } from '@colyseus/schema'
    import type { TicTacToeState } from '@tabletop-arena/game-schema'

    import { goto } from '$app/navigation'
    import BlobLoader from '$lib/component/BlobLoader.svelte'
    import CenterContainer from '$lib/component/CenterContainer.svelte'
    import { initGameContext } from '$lib/context/game-context'

    import type { PageData } from './$types'

    export let data: PageData

    const gameContext = initGameContext<TicTacToeState>({ authToken: data.gameToken })
    const gameStore = gameContext.createStore('tictactoe', {
        area: { table: new MapSchema(), actions: new ArraySchema() },
        participants: new ArraySchema(),
        currentTurn: null,
        moves: new ArraySchema(),
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
