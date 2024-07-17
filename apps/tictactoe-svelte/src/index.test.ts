import { describe, it } from 'vitest'

describe('sum test', () => {
    it('adds 1 + 2 to equal 3', ({ expect }) => {
        expect(1 + 2).toBe(3)
    })
})
