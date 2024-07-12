import { nanoid } from 'nanoid'

export const getSessionIdKey = () => 'visitorId'
export const generateSessionId = (): string => nanoid(16)
