import jwt from 'jsonwebtoken';
import {TokenInterface} from "../models/AuthModel";

class AuthService {
    static generateToken(payload: object,
                         secretKey: jwt.Secret,
                         sessionMinutes: number = 60): TokenInterface {
        const expiryTime: number = Math.floor(Date.now() / 1000) + sessionMinutes * 60;
        return {
            token: jwt.sign(payload, secretKey, {
                expiresIn: expiryTime
            }),
            expiry: expiryTime
        }
    }
}

export default AuthService;