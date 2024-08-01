<script lang="ts">
    import type { TicTacToeState } from '@tabletop-arena/game-schema'

    import { initGameContext } from '$lib/context/game-context'

    import type { PageData } from './$types'

    export let data: PageData

    initGameContext<TicTacToeState>({ authToken: data.gameToken })
</script>

<slot />
