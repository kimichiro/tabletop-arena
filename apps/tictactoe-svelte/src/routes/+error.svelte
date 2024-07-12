<script lang="ts">
    import { page } from '$app/stores'

    import CenterContainer from '$lib/component/CenterContainer.svelte'
</script>

<CenterContainer>
    <h1>ERROR {$page.status}</h1>
    <p>{$page.error?.message}</p>
</CenterContainer>
