export interface Identity {
    readonly id: string
    readonly name: string
    readonly userId: string
}

export type ConnectionStatus = 'unknown' | 'online' | 'offline'
export interface Connection {
    status: ConnectionStatus
}
