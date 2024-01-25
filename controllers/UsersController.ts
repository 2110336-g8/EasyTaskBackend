import { NextFunction, Request, Response } from "express";
import UserService from "../services/UsersService";
import { ValidationError } from "../exceptions/UsersError";

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Assuming that request body contains user data
        const userData = req.body;

        // Create a new user using the UserService
        const newUser = await UserService.postUser(userData);

        // Respond with the created user
        res.status(201).json(newUser);
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: 'Invalid data', details: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error'});
        }
    }
};