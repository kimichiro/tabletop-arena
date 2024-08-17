export type Connection = 'unknown' | 'online' | 'offline'

export interface Identity {
    readonly id: string
    readonly name: string
    readonly userId: string

    readonly self: true | null

    connection: Connection
}

export type ClientIdentity = Omit<Identity, 'self' | 'connection'>
