import { Schema, type } from '@colyseus/schema'

import { Connection, ConnectionStatus, Identity } from './identity'

export class IdentitySchema extends Schema implements Identity {
    @type('string') readonly id: string
    @type('string') readonly name: string
    @type('string') readonly userId: string

    constructor(payload: Identity) {
        super(payload)
        this.id = payload.id
        this.name = payload.name
        this.userId = payload.userId
    }
}

export class ConnectionSchema extends Schema implements Connection {
    @type('string') status: ConnectionStatus = 'unknown'
}
