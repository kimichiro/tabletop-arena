/** @type { import('ts-jest').JestConfigWithTsJest } */
module.exports = {
    noStackTrace: true,
    rootDir: 'test',
    setupFiles: ['<rootDir>/setup.ts'],
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+.ts$': 'ts-jest'
    }
}
