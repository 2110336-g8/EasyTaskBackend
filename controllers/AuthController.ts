import {NextFunction, Request, Response} from "express";
import UserService from "../services/UsersService";
import {ValidationError} from "../exceptions/UsersError";
import {getHelloWorldMessage} from "../services/test";
import AuthService from "../services/AuthService";

export const testAuthServer = async function (req: Request, res: Response) {
    res.send(getHelloWorldMessage());
};

export const getToken = async function (req: Request, res: Response) {
    const token: string = AuthService.getToken(req, 0);

    res.status(200).json({
        token: token
    });
};

export const checkToken = async function (req: Request, res: Response) {
    res.status(401).json({
        message: 'Unauthorized'
    });
};