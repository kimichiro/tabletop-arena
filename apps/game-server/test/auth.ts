export const AUTH_USER_101_ID = `101`
export const AUTH_USER_101_NAME = `user101`

export const AUTH_USER_102_ID = `102`
export const AUTH_USER_102_NAME = `user102`

export const toJSON = (json: object) => Buffer.from(JSON.stringify(json)).toString('base64')
