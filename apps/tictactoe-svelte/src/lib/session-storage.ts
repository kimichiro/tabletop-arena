const sessions = new Map<string, SessionData>()

interface SessionData {
    name: string
    matching?: boolean
}

export function persistSession(key: string, value: SessionData): void {
    sessions.set(key, value)
}

export function loadSession(key: string): Partial<SessionData> {
    const value = sessions.get(key)

    return value ?? {}
}
