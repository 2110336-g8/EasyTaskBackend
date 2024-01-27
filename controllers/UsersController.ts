import { NextFunction, Request, Response } from "express";
import UserService from "../services/UsersService";
import { ValidationError } from "../exceptions/UsersError";

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Assuming that request body contains user data
        const userData = req.body

        // Create a new user using the UserService
        const newUser = await UserService.postUser(userData)

        // Respond with the created user
        res.status(201).json(newUser)
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: 'Invalid data', details: error.message })
        } else {
            res.status(500).json({ error: 'Internal server error'})
        }
    }
}

export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.params.obj_id;
        const updatedData = req.body;

        const updatedUser = await UserService.updateUserProfile(userId, updatedData);

        res.status(200).json(updatedUser);
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: 'Invalid data', details: error.message })
        } else {
            res.status(500).json({ error: 'Internal server error'})
        }
    }
}

export const isPhoneNumberExist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const phoneNumber = req.params.phoneNo
        const isExist = await UserService.isPhoneNumberExist(phoneNumber)
        res.status(200).json({isExist})
    } catch (error) {
        console.error(error)
    }
}