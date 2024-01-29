import { NextFunction, Request, Response } from 'express'
import UserService from '../services/UsersService'
import {
    UserValidationError,
    UserNotFoundError,
} from '../exceptions/UsersError'

export const getUserInformation = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = req.params.obj_id
        const user = await UserService.getUserById(userId)
        res.status(200).json(user)
    } catch (error) {
        if (error instanceof UserNotFoundError) {
            res.status(404).json({
                error: error.name,
                details: error.message,
            })
        } else if (error instanceof UserValidationError) {
            res.status(400).json({
                error: error.name,
                details: error.message,
            })
        } else {
            res.status(500).json({ error: 'Internal server error' })
        }
    }
}

export const deleteUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = req.params.obj_id
        const password = req.body.password
        await UserService.deleteUser(userId, password)
        res.status(204)
    } catch (error) {
        if (error instanceof UserValidationError) {
            res.status(400).json({
                error: error.name,
                details: error.message,
            })
        } else if (error instanceof UserNotFoundError) {
            res.status(404).json({
                error: error.name,
                details: error.message,
            })
        } else {
            res.status(500).json({ error: 'Internal server error' })
        }
    }
}

export const updateUserProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = req.params.obj_id
        const updatedData = req.body
        const updatedUser = await UserService.updateUserProfile(
            userId,
            updatedData,
        )

        res.status(200).json(updatedUser)
    } catch (error) {
        if (error instanceof UserValidationError) {
            res.status(400).json({
                error: error.name,
                details: error.message,
            })
        } else if (error instanceof UserNotFoundError) {
            res.status(404).json({
                error: error.message,
                details: error.message,
            })
        } else {
            res.status(500).json({ error: 'Internal server error' })
        }
    }
}

export const isPhoneNumberExist = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const phoneNumber = req.params.phoneNo
        const isExist = await UserService.isPhoneNumberExist(phoneNumber)
        res.status(200).json({ isExist })
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' })
    }
}
