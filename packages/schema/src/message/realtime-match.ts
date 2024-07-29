export const MatchAskMessageName = 'match-ask'
export type MatchAskPayload = never

export const ActionMessageName = 'action'
export type ActionPayload<Payload extends object> = Payload

export const OnStartMessageName = 'start'
export type OnStartPayload = never

export const OnEndedMessageName = 'ended'
export type OnEndedPayload = never

export const OnStateChangedMessageName = 'state-changed'
export type OnStateChangedPayload<State> = State
