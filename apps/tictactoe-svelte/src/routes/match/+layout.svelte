<script lang="ts">
    import { initGameContext } from '$lib/context/game-context'

    import type { PageData } from './$types'

    export let data: PageData

    initGameContext({ authToken: data.gameToken })
</script>

<slot />
