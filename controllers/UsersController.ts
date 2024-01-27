import { NextFunction, Request, Response } from "express";
import UserService from "../services/UsersService";
import { ValidationError, UserNotFoundError } from "../exceptions/UsersError";

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

export const getUserInformation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        //get by object id
        const userId = req.params.obj_id;

        const user = await UserService.getUserInformation(userId);

        res.status(200).json(user);
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: 'Invalid data', details: error.message });
        } else if(error instanceof UserNotFoundError){
            res.status(404).json({ error: 'User not found', details: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.params.obj_id;
        const password = req.body.password;

        // Call the UserService method to delete the user
        await UserService.deleteUser(userId, password);

        // Respond with a success message
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error); // Log the error
        if (error instanceof ValidationError) {
            res.status(400).json({ error: 'Invalid data', details: error.message });
        } else if(error instanceof UserNotFoundError){
            res.status(404).json({ error: 'User not found', details: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};


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
        res.status(500).json({error: 'Internal server error'})
    }
}