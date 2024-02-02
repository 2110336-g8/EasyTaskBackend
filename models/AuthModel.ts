export interface ILogin {
    email: string;
    password: string;
}

export const isValidILogin = function (obj: any): obj is ILogin {
    return (
        obj && typeof obj.email === 'string' && typeof obj.password === 'string'
    );
};

export interface ISendOtp {
    email: string;
}

export const isValidISendOtp = function (obj: any): obj is ISendOtp {
    return obj && typeof obj.email === 'string';
};

export interface IVerifyOtp {
    email: string;
    otp: string;
}

export const isValidIVerifyOtp = function (obj: any): obj is IVerifyOtp {
    return obj && typeof obj.email === 'string' && typeof obj.otp === 'string';
};
