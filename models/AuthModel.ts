export interface LoginInterface {
    phoneNumber: string;
    password: string;
}

export const isValidLoginInterface = function (obj: any): obj is LoginInterface {
    return obj && typeof obj.phoneNumber === 'string' && typeof obj.password === 'string';
}
