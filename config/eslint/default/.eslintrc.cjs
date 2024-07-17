const { rules } = require('eslint-config-prettier')

module.exports = {
    root: true,
    extends: ['../.eslintrc.cjs', 'prettier', 'turbo'],
    rules: {
        '@typescript-eslint/no-var-requires': ['error', { allow: ['package\\.json$'] }]
    }
}
