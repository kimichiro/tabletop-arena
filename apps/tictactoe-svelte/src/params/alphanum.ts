import type { ParamMatcher } from '@sveltejs/kit'

export const match: ParamMatcher = (param) => {
    return /^[_\-a-zA-Z0-9]+$/.test(param)
}
