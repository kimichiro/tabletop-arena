export enum ErrorCode {
    Consented = 4000,

    MismatchClient = 5000,

    InvalidAction = 9000,
    InvalidParticipant = 9001,
    AlreadyEnded = 9002
}

export class GameError extends Error {
    readonly code: number

    constructor(code: number, message: string) {
        super(message)
        this.code = code
    }
}

export class MismatchClientError extends GameError {
    constructor() {
        super(ErrorCode.MismatchClient, `mismatch client`)
        this.name = MismatchClientError.name
    }
}

export class InvalidActionError extends GameError {
    constructor(message: string) {
        super(ErrorCode.InvalidAction, message)
        this.name = InvalidActionError.name
    }
}

export class InvalidParticipantError extends GameError {
    constructor() {
        super(ErrorCode.InvalidParticipant, `invalid participant`)
        this.name = InvalidParticipantError.name
    }
}

export class AlreadyEndedError extends GameError {
    constructor() {
        super(ErrorCode.AlreadyEnded, `already ended`)
        this.name = AlreadyEndedError.name
    }
}
