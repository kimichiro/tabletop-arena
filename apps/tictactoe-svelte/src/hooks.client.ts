/** @type {import('@sveltejs/kit').HandleClientError} */
export async function handleError({ error }) {
    const errorId = crypto.randomUUID()

    return { message: `[/hooks.client.ts|${errorId}] ${error}` }
}
