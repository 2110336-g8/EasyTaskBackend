export interface ILoginInterface {
    phoneNumber: string
    password: string
}

export const isValidLoginInterface = function (
    obj: any,
): obj is ILoginInterface {
    return (
        obj &&
        typeof obj.phoneNumber === 'string' &&
        typeof obj.password === 'string'
    )
}
