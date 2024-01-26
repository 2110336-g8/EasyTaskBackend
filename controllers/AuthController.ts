import {NextFunction, Request, Response} from "express";
import UserService from "../services/UsersService";
import {ValidationError} from "../exceptions/UsersError";
import {getHelloWorldMessage} from "../services/test";
import AuthService from "../services/AuthService";
import {LoginInterface, TokenInterface} from "../models/AuthModel";

export const testAuthServer = async function (req: Request, res: Response) {
    res.send(getHelloWorldMessage());
};

export const newToken = async function (req: Request, res: Response) {
    res.send(req.body);

    // if ('phoneNumber' in data && 'password' in data) {
    //     res.status(200).json({
    //         token: AuthService.generateToken(data, 'secretKey', 60).token
    //     });
    // } else {
    //     res.status(400).json({});
    // }
};

export const checkToken = async function (req: Request, res: Response) {
    res.status(401).json({
        message: 'Unauthorized'
    });
};