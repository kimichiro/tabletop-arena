import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        coverage: {
            reporter: ['json', 'html']
        },
        expect: {
            requireAssertions: true
        }
    }
})
