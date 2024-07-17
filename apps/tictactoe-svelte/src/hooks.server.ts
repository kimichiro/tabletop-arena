import { HOST, PORT } from '$env/static/private'

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    if (event.url.pathname.startsWith('/force-error')) {
        throw new Error(`force throwing unexpected error on server hook (not using 'error()')`)
    }

    if (event.url.pathname.startsWith('/hook')) {
        const sessionid = event.cookies.get('sessionid')

        const responseBody =
            sessionid == null ? '[/hooks.server.ts] first visitor' : `[/hooks.server.ts] revisitor (${sessionid})`

        const response = new Response(responseBody)

        response.headers.set('set-cookie', `sessionid=${sessionid ?? crypto.randomUUID()}; max-age=60`)
        response.headers.set('x-custom-header', 'hook')

        return response
    }

    return await resolve(event)
}

/** @type {import('@sveltejs/kit').HandleServerError} */
export async function handleError({ error }) {
    const errorId = crypto.randomUUID()

    return { message: `[/hooks.server.ts|${errorId}] ${error}` }
}

/** @type {import('@sveltejs/kit').HandleFetch} */
export async function handleFetch({ request, fetch }) {
    if (request.url.startsWith('http://starter-kit-svelte')) {
        request = new Request(
            request.url.replace('http://starter-kit-svelte', `http://${HOST}${PORT != null ? ':' : ''}${PORT}`),
            request
        )
    }

    return fetch(request)
}
