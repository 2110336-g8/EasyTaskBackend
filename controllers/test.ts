import { Request, Response, NextFunction } from 'express';

export const getHelloWorld = (req: Request, res: Response, next: NextFunction) => {
    res.send('Hello World!');
};