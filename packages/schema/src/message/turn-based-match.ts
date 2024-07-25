export const MatchAskMessageType = 'match-ask'
export interface MatchAskPayload {}

export const GameMoveMessageType = 'game-move'
export interface GameMovePayload<Action extends object = object> {
    action: Action
}

export const GameStartedMessageType = 'game-started'
export interface GameStartedPayload {}

export const GameEndedMessageType = 'game-ended'
export interface GameEndedPayload {}

export const GameMoveErrorMessageType = 'game-move-error'
export interface GameMoveErrorPayload {
    message: string
}
