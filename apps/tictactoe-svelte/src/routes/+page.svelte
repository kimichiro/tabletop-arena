<script lang="ts">
    import CenterContainer from '$lib/component/CenterContainer.svelte'
    import type { PageData } from './$types'

    export let data: PageData
</script>

<CenterContainer>
    <article class="prose lg:prose-xl">
        <h1>eX-Oh!</h1>
        <form method="post">
            <div class="flex gap-4 flex-col">
                <label class="input input-bordered flex items-center gap-2">
                    <input
                        type="text"
                        name="name"
                        class="grow text-center"
                        placeholder="What's your name ?"
                        pattern="[_\w]+"
                        bind:value={data.visitorName}
                    />
                </label>
                <input type="submit" value="Go!" class="btn btn-block btn-active" />
            </div>
        </form>
    </article>
</CenterContainer>
