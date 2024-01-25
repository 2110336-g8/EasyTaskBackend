import { Request, Response, NextFunction } from 'express';
import { getHelloWorldMessage } from '../services/test';

export const getHelloWorld = (req: Request, res: Response, next: NextFunction) => {
    const messege = getHelloWorldMessage()
    res.send(messege)
};