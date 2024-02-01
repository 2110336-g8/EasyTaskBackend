import { NextFunction, Request, Response } from 'express';
import { isValidLoginInterface } from '../models/AuthModel';
import { AuthService } from '../services/AuthService';
import { Inject, Service } from 'typedi';

@Service()
class AuthMiddleware {
    private authService: AuthService;

    constructor(@Inject() authService: AuthService) {
        this.authService = authService;
    }

    validateLoginRequest(
        req: Request,
        res: Response,
        next: NextFunction,
    ): void {
        // Use authService or authRepository for validation logic
        // Example: if (this.authService.isValidLogin(req.body)) {
        if (true) {
            next();
        } else {
            res.status(400).json({});
        }
    }

    validateToken(req: Request, res: Response, next: NextFunction): void {
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
            respondUnAuth(res);
        }
    }
}

export default AuthMiddleware;
