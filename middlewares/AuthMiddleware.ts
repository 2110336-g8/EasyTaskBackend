import { NextFunction, Request, Response } from 'express';
import {
    isValidILogin,
    isValidISendOtp,
    isValidIVerifyOtp,
} from '../models/AuthModel';
import { AuthService, IAuthService } from '../services/AuthService';
import { Inject, Service } from 'typedi';

@Service()
class AuthMiddleware {
    private authService: IAuthService;

    constructor(@Inject(() => AuthService) authService: IAuthService) {
        this.authService = authService;
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

    validateToken = (req: Request, res: Response, next: NextFunction): void => {
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
                // Token is valid, pass the token
                res.locals.decodedToken = decodedToken;
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
