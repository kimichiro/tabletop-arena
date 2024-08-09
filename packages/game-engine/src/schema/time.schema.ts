import { Schema, type } from '@colyseus/schema'

import { TimeDuration } from './time'

export class TimeDurationSchema extends Schema implements TimeDuration {
    @type('number') minutes: number = 0
    @type('number') seconds: number = 0

    @type('number') asMilliseconds: number = 0
}
