import { Schema, type } from '@colyseus/schema'

import { Connection, ConnectionStatus, Identity } from '../state/identity'

export class IdentitySchema extends Schema implements Identity {
    @type('string') readonly id: string
    @type('string') readonly name: string
    @type('string') readonly userId: string

    constructor(id: string, name: string, userId: string) {
        super()
        this.id = id
        this.name = name
        this.userId = userId
    }
}

export class ConnectionSchema extends Schema implements Connection {
    @type('string') status: ConnectionStatus = 'unknown'
}
