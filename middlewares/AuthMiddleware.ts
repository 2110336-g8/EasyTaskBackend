import { NextFunction, Request, Response } from 'express';
import {
    isValidILogin,
    isValidISendOtp,
    isValidIVerifyOtp,
} from '../models/AuthModel';
import { AuthService, IAuthService } from '../services/AuthService';
import { Inject, Service } from 'typedi';
import { IUser, IUserDocument } from '../models/UserModel';
import { IUsersService, UsersService } from '../services/UsersService';

@Service()
class AuthMiddleware {
    private authService: IAuthService;
    private usersService: IUsersService;

    constructor(
        @Inject(() => AuthService) authService: IAuthService,
        @Inject(() => UsersService) usersService: IUsersService,
    ) {
        this.authService = authService;
        this.usersService = usersService;
    }

    validateSendOtpRequest = (
        req: Request,
        res: Response,
        next: NextFunction,
    ): void => {
        if (isValidISendOtp(req.body)) {
            next();
        } else {
            res.status(400).json({
                error: 'Invalid Request',
                details: 'Email is required to send OTP',
            });
        }
    };

    validateVerifyOtpRequest = (
        req: Request,
        res: Response,
        next: NextFunction,
    ): void => {
        if (isValidIVerifyOtp(req)) {
            next();
        } else {
            res.status(400).json({
                error: 'Email and OTP are required to send OTP',
            });
        }
    };

    validateLoginRequest = (
        req: Request,
        res: Response,
        next: NextFunction,
    ): void => {
        if (isValidILogin(req.body)) {
            next();
        } else {
            res.status(400).json({
                error: 'Invalide Request',
                details: 'Email and password are required to login',
            });
        }
    };

    validateToken = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const respondUnAuth = function (res: Response): void {
            res.status(401).json({
                error: 'Unauthorized',
            });
        };

        const auth = req.headers['authorization'];

        if (auth === undefined) {
            respondUnAuth(res);
            return;
        }

        const token = auth.split(' ')[1];

        try {
            const decodedToken = this.authService.decodeToken(token);
            // @ts-ignore
            if (Date.now() >= decodedToken.exp * 1000) {
                // If expired
                respondUnAuth(res);
            } else {
                // Add user to req
                const user = await this.usersService.getUserById(
                    (decodedToken as { id: string }).id,
                );
                if (!user) {
                    respondUnAuth(res);
                    return;
                }
                req.user = user;
                next();
            }
        } catch (error) {
            // Token is invalid (failed decode)
            console.log('Fail to Decode:', error);
            respondUnAuth(res);
        }
    };
}

export default AuthMiddleware;
