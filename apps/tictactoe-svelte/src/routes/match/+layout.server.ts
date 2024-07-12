import { redirect } from '@sveltejs/kit'

import { getSessionIdKey } from '$lib/cookie-generator'
import { loadSession } from '$lib/session-storage'

import type { LayoutServerLoad } from './$types'

interface ServerData {
    gameToken: string

    visitorName: string

    matchId?: string
}

export const load: LayoutServerLoad<ServerData> = async ({ cookies, params }) => {
    const sessionIdKey = getSessionIdKey()
    const sessionIdValue = cookies.get(sessionIdKey)
    if (sessionIdValue == null) {
        redirect(302, '/')
    }

    const sessionObject = loadSession(sessionIdValue)
    const { name: visitorName, matching } = sessionObject
    if (visitorName == null || !matching) {
        redirect(302, '/')
    }

    const authToken = { ...sessionObject, id: sessionIdValue }
    const gameToken = Buffer.from(JSON.stringify(authToken)).toString('base64')

    const { matchId } = params

    return { gameToken, visitorName, matchId }
}
