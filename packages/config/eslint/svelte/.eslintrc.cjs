module.exports = {
    root: true,
    extends: ['../.eslintrc.cjs', 'plugin:svelte/recommended', 'prettier', 'turbo'],
    parserOptions: {
        extraFileExtensions: ['.svelte']
    },
    overrides: [
        {
            files: ['*.svelte'],
            parser: 'svelte-eslint-parser',
            parserOptions: {
                parser: '@typescript-eslint/parser'
            }
        }
    ]
}
