import { NextFunction, Request, Response } from 'express'
import { isValidLoginInterface } from '../models/AuthModel'
import { AuthService } from '../services/AuthService'
import { Inject, Service } from 'typedi'

@Service()
class AuthMiddleware {
    private authService: AuthService

    constructor(@Inject() authService: AuthService) {
        this.authService = authService
    }

    validateLoginRequest(
        req: Request,
        res: Response,
        next: NextFunction,
    ): void {
        // Use authService or authRepository for validation logic
        // Example: if (this.authService.isValidLogin(req.body)) {
        if (true) {
            next()
        } else {
            res.status(400).json({})
        }
    }

    validateToken(req: Request, res: Response, next: NextFunction): void {
        const respond401 = function (res: Response): void {
            res.status(401).json({
                message: 'Unauthorized',
            })
        }

        const auth = req.headers['authorization']

        if (auth === undefined) {
            respond401(res)
            return
        }

        const token = auth.split(' ')[1]

        try {
            const decodedToken = this.authService.decodeToken(token)

            // @ts-ignore
            if (Date.now() >= decodedToken.exp * 1000) {
                // If expired
                respond401(res)
            } else {
                // Token is valid, pass the token
                res.locals.decodedToken = decodedToken
                next()
            }
        } catch (error) {
            // Token is invalid (failed decode)
            respond401(res)
        }
    }
}

export default AuthMiddleware
