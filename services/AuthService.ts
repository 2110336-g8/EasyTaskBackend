import jwt from 'jsonwebtoken';
import fs from 'fs';
import {LoginInterface} from "../models/AuthModel";
import { UserModel } from '../models/UserModel';
import { UserNotFoundError } from '../exceptions/UsersError';
import { compare } from 'bcrypt';

const key_pair = {
    key: fs.readFileSync(`${__dirname}/../config/rs256.key`),
    pub: fs.readFileSync(`${__dirname}/../config/rs256.key.pub`)
};

class AuthService {
    static generateToken(payload: LoginInterface,
                         sessionMinutes: number = 60): string {
        const expiryTime: number = Math.floor(Date.now() / 1000) + sessionMinutes * 60;
        const subpayload = {
            phoneNumber: payload.phoneNumber
        };
        return jwt.sign(subpayload, key_pair.key, {
            expiresIn: expiryTime,
            algorithm: 'RS256'
        });
    }

    static decodeToken(token: string) {
        return jwt.verify(token, key_pair.pub, {
            algorithms: ['RS256']
        });
    }

    static async verifyUser(login: LoginInterface): Promise<boolean> {
        // TODO: phoneNumber - password database lookup handling
        //return true;
        const user = await UserModel.findOne({phoneNumber : login.phoneNumber})

        if (!user) {
           return false
        }

        const isMatch = await user.isValidPassword(login.password)
        return isMatch

    }
}

export default AuthService;