export enum Role {
    Oh = 'O',
    Ex = 'X'
}

export enum Position {
    A1 = 'a1',
    A2 = 'a2',
    A3 = 'a3',
    B1 = 'b1',
    B2 = 'b2',
    B3 = 'b3',
    C1 = 'c1',
    C2 = 'c2',
    C3 = 'c3'
}

export interface GameAction {
    readonly role: Role
    readonly position: Position
}

export interface GameArea<Action extends GameAction = GameAction> {
    readonly table: Record<string, Role>

    readonly actions: Action[]
}

export type ConnectionStatus = 'unknown' | 'online' | 'offline'
export interface Connection {
    readonly status: ConnectionStatus
}

export interface TimeDuration {
    readonly minutes: number
    readonly seconds: number
}

export interface Player {
    readonly id: string
    readonly name: string
    readonly userId: string
    readonly connection: Connection
    readonly remainingTime: TimeDuration

    readonly role: Role
}

export interface GameMove {
    readonly notation: string
    readonly player: Player
}

export interface GameResult {
    readonly draw: boolean
    readonly winner: Player | null
}

export interface GameState<
    Area extends GameArea = GameArea,
    Participant extends Player = Player,
    Move extends GameMove = GameMove,
    Result extends GameResult = GameResult
> {
    readonly area: Area
    readonly participants: Participant[]
    readonly currentTurn: Participant | null

    readonly moves: Move[]
    readonly result: Result | null
}
