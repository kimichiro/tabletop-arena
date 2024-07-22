/** @type { import("eslint").Linter.Config } */
module.exports = {
    extends: ['@tabletop-arena/eslint-config', 'prettier', 'turbo'],
    rules: {
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_+' }]
    },
    ignorePatterns: ['build/**/*']
}
