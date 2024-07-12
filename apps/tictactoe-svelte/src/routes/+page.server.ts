import { redirect } from '@sveltejs/kit'

import { generateSessionId, getSessionIdKey } from '$lib/cookie-generator'
import { loadSession, persistSession } from '$lib/session-storage'

import type { Actions, PageServerLoad } from './$types'

export const actions: Actions = {
    default: async ({ cookies, request }) => {
        const data = await request.formData()

        const name = data.get('name')?.toString()

        const sessionIdKey = getSessionIdKey()
        const sessionIdValue = cookies.get(sessionIdKey) ?? generateSessionId()
        if (name != null) {
            cookies.set(sessionIdKey, sessionIdValue, { path: '/' })

            persistSession(sessionIdValue, { name, matching: true })
        }

        redirect(302, '/match')
    }
}

interface ServerData {
    visitorName?: string
}

export const load: PageServerLoad<ServerData> = async ({ cookies }) => {
    let visitorName: string | undefined

    const sessionIdKey = getSessionIdKey()
    const sessionIdValue = cookies.get(sessionIdKey)
    if (sessionIdValue != null) {
        const { name } = loadSession(sessionIdValue)
        visitorName = name
    }

    return { visitorName }
}
