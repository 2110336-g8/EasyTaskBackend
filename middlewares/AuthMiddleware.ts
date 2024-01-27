import {NextFunction, Request, Response} from "express";
import {isValidLoginInterface} from "../models/AuthModel";
import AuthService from "../services/AuthService";

/**
 * Middleware: Validate login information from client
 *
 * @param req
 * @param res
 * @param next
 */
export const validateLoginRequest = async function (req: Request, res: Response, next: NextFunction) {
    if (isValidLoginInterface(req.body)) {
        next();
    } else {
        res.status(400).json({})
    }
}

/**
 * Middleware: Check if the token is valid AND not expired
 *
 * @param req
 * @param res
 * @param next
 */
export const validateToken = async function (req: Request, res: Response, next: NextFunction) {
    const respond401 = function (res: Response) {
        res.status(401).json({
            message: 'Unauthorized'
        });
    }

    const auth = req.headers['authorization'];

    if (auth === undefined) {
        respond401(res);
        return;
    }

    const token = auth.split(' ')[1]

    try {
        const decodedToken = AuthService.decodeToken(token);

        // @ts-ignore
        if (Date.now() >= decodedToken.exp * 1000) {
            // If expired
            respond401(res);
        } else {
            // Token is valid, pass the token
            res.locals.decodedToken = decodedToken;
            next();
        }
    } catch (error) {
        // Token is invalid (failed decode)
        respond401(res);
    }
};