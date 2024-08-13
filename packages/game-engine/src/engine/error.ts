import { ErrorCode } from '@tabletop-arena/game-client/schema'

export class EngineError extends Error {
    readonly code: number

    constructor(code: number, message: string) {
        super(message)
        this.code = code
    }
}

export class UnknownClientError extends EngineError {
    constructor() {
        super(ErrorCode.UnknownClient, `unknown client`)
        this.name = UnknownClientError.name
    }
}

export class UnavailableSeatError extends EngineError {
    constructor() {
        super(ErrorCode.UnavailableSeat, `unavailable seat`)
        this.name = UnavailableSeatError.name
    }
}

export class InvalidActionError extends EngineError {
    constructor(message: string) {
        super(ErrorCode.InvalidAction, message)
        this.name = InvalidActionError.name
    }
}

export class InvalidPlayerError extends EngineError {
    constructor() {
        super(ErrorCode.InvalidPlayer, `invalid player`)
        this.name = InvalidPlayerError.name
    }
}

export class AlreadyEndedError extends EngineError {
    constructor() {
        super(ErrorCode.AlreadyEnded, `already ended`)
        this.name = AlreadyEndedError.name
    }
}
