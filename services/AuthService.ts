import jwt, { JwtPayload } from 'jsonwebtoken';
import fs from 'fs';
import { Inject, Service } from 'typedi';
import { ILogin } from '../models/AuthModel';
import { IUsersService, UsersService } from './UsersService';
import { IUserDocument } from '../models/UserModel';

export interface IAuthService {
    generateToken: (payload: ILogin, sessionMinutes?: number) => string;
    decodeToken: (token: string) => string | JwtPayload;
    verifyUser: (login: ILogin) => Promise<IUserDocument | null>;
}
@Service()
export class AuthService implements IAuthService {
    private usersService: IUsersService;
    private key_pair = {
        key: fs.readFileSync(`${__dirname}/../config/rs256.key`),
        pub: fs.readFileSync(`${__dirname}/../config/rs256.key.pub`),
    };

    constructor(@Inject(() => UsersService) usersService: IUsersService) {
        this.usersService = usersService;
    }

    generateToken(
        payload: ILogin,
        sessionMinutes: number = parseInt(process.env.JWT_EXP_MIN || '60'),
    ): string {
        const expiryTime: number =
            Math.floor(Date.now() / 1000) + sessionMinutes * 60;
        const subPayload = {
            phoneNumber: payload.email,
        };
        return jwt.sign(subPayload, this.key_pair.key, {
            expiresIn: expiryTime,
            algorithm: 'RS256',
        });
    }

    decodeToken(token: string): string | JwtPayload {
        return jwt.verify(token, this.key_pair.pub, {
            algorithms: ['RS256'],
        });
    }

    async verifyUser(login: ILogin): Promise<IUserDocument | null> {
        try {
            const user = await this.usersService.getUserByEmail(login.email);
            if (!user) return null;

            const isVerify = await user.isValidPassword(login.password);
            return isVerify ? user : null;
        } catch (error) {
            return null;
        }
    }
}
