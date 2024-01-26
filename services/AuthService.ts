import jwt from 'jsonwebtoken';

class AuthService {
    static getToken(payload: string | object, secretKey: any): string {
        try {
            return jwt.sign(payload, secretKey, {
                expiresIn: 24 * 60 * 60
            });
        } catch (error) {
            return "";
        }
    }
}

export default AuthService;