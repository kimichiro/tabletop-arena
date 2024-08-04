export enum ErrorCode {
    Consented = 4000,

    UnknownClient = 5000,
    UnavailableSeat = 5001,

    InvalidAction = 9000,
    InvalidPlayer = 9001,
    AlreadyEnded = 9002
}

export class GameError extends Error {
    readonly code: number

    constructor(code: number, message: string) {
        super(message)
        this.code = code
    }
}

export class UnknownClientError extends GameError {
    constructor() {
        super(ErrorCode.UnknownClient, `unknown client`)
        this.name = UnknownClientError.name
    }
}

export class UnavailableSeatError extends GameError {
    constructor() {
        super(ErrorCode.UnavailableSeat, `unavailable seat`)
        this.name = UnavailableSeatError.name
    }
}

export class InvalidActionError extends GameError {
    constructor(message: string) {
        super(ErrorCode.InvalidAction, message)
        this.name = InvalidActionError.name
    }
}

export class InvalidPlayerError extends GameError {
    constructor() {
        super(ErrorCode.InvalidPlayer, `invalid player`)
        this.name = InvalidPlayerError.name
    }
}

export class AlreadyEndedError extends GameError {
    constructor() {
        super(ErrorCode.AlreadyEnded, `already ended`)
        this.name = AlreadyEndedError.name
    }
}
