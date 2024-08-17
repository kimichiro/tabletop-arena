import { Schema, type } from '@colyseus/schema'

import { Duration } from './duration'

export class DurationSchema extends Schema implements Duration {
    @type('number') minutes: number = 0
    @type('number') seconds: number = 0

    @type('number') asMilliseconds: number = 0
}
