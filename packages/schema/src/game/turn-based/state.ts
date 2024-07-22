import { ArraySchema, Schema, type } from '@colyseus/schema'

export class GameAction extends Schema {}

export abstract class GameArea<Action extends GameAction> extends Schema {
    @type({ array: GameAction }) actions: ArraySchema<Action> = new ArraySchema<Action>()
}

export type ConnectionStatus = 'unknown' | 'online' | 'offline'
export class Connection extends Schema {
    @type('string') status: ConnectionStatus = 'unknown'
}

export class TimeDuration extends Schema {
    @type('number') minutes: number = 0
    @type('number') seconds: number = 0

    @type('number') asMilliseconds: number = 0
}

export class GameParticipant extends Schema {
    @type('string') id: string
    @type('string') name: string
    @type('string') userId: string
    @type(Connection) connection: Connection = new Connection()
    @type(TimeDuration) remainingTime: TimeDuration = new TimeDuration()

    constructor(id: string, name: string, userId: string) {
        super()

        this.id = id
        this.name = name
        this.userId = userId
    }
}

export class GameMove extends Schema {
    @type('string') notation: string
    @type(GameParticipant) participant: GameParticipant

    constructor(notation: string, participant: GameParticipant) {
        super()

        this.notation = notation
        this.participant = participant
    }
}

export class GameResult extends Schema {
    @type('boolean') draw: boolean
    @type(GameParticipant) winner: GameParticipant | null

    constructor(draw: boolean, winner: GameParticipant | null) {
        super()

        this.draw = draw
        this.winner = winner
    }
}

export class GameState<
    Action extends GameAction,
    Area extends GameArea<Action>,
    Participant extends GameParticipant = GameParticipant,
    Move extends GameMove = GameMove,
    Result extends GameResult = GameResult
> extends Schema {
    @type(GameArea) area: Area
    @type({ array: GameParticipant }) participants: ArraySchema<Participant>
    @type(GameParticipant) currentTurn: Participant | null

    @type({ array: GameMove }) moves: ArraySchema<Move>
    @type(GameResult) result: Result | null

    constructor(
        area: Area,
        participants: ArraySchema<Participant> = new ArraySchema<Participant>(),
        currentTurn: Participant | null = null,
        moves: ArraySchema<Move> = new ArraySchema<Move>(),
        result: Result | null = null
    ) {
        super()

        this.area = area
        this.participants = participants
        this.currentTurn = currentTurn
        this.moves = moves
        this.result = result
    }
}
