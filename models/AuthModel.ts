export interface ILoginInterface {
    email: string;
    password: string;
}

export const isValidLoginInterface = function (
    obj: any,
): obj is ILoginInterface {
    return (
        obj && typeof obj.email === 'string' && typeof obj.password === 'string'
    );
};
