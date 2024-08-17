import { filter, Schema, type } from '@colyseus/schema'
import { Client } from 'colyseus'

import { ClientIdentity, Connection, Identity } from './identity'

export class IdentitySchema extends Schema implements Identity {
    @type('string') readonly id: string
    @type('string') readonly name: string
    @type('string') readonly userId: string

    @filter(function (this: IdentitySchema, client: Client) {
        return this.id === client.id
    })
    @type('boolean')
    readonly self: true | null = true

    @type('string') connection: Connection = 'unknown'

    constructor(payload: ClientIdentity) {
        super(payload)
        this.id = payload.id
        this.name = payload.name
        this.userId = payload.userId
    }
}
