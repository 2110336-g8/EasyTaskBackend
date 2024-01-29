import { NextFunction, Request, Response } from 'express'
import AuthService from '../services/AuthService'
import { LoginInterface } from '../models/AuthModel'
import { User, UserDocument } from '../models/UserModel'
import UserService from '../services/UsersService'
import { UserValidationError } from '../exceptions/UsersError'

/**
 * Generate new token from phoneNumber of login info.
 *
 * @param req
 * @param res
 */
export const newToken = async function (req: Request, res: Response) {
    const data: LoginInterface = req.body

    res.status(200).json({
        token: AuthService.generateToken(data, 60),
    })
}

export const checkValidateToken = async function (req: Request, res: Response) {
    if ('decodedToken' in res.locals) {
        const decodedToken = res.locals.decodedToken

        res.status(200).json({
            message: decodedToken,
        })
    } else {
        res.status(401).json({
            message: 'Unauthorized',
        })
    }
}

export const registerUser = async (req: Request, res: Response) => {
    try {
        const userData = req.body
        const newUser: UserDocument = await UserService.postUser(userData)
        const loginData: LoginInterface = newUser
        const token = AuthService.generateToken(loginData)
        res.status(201).json({
            user: newUser,
            token,
        })
    } catch (error) {
        if (error instanceof UserValidationError) {
            res.status(400).json({
                error: error.name,
                details: error.message,
            })
        } else {
            res.status(500).json({ error: 'Internal server error' })
        }
    }
}

export const loginUser = async function (req: Request, res: Response) {
    const data: LoginInterface = req.body
    const validUserPassword = await AuthService.verifyUser(data)

    if (!validUserPassword) {
        res.status(401).json({
            message: 'Unauthorized',
        })
    } else {
        const token = AuthService.generateToken(data)
        res.status(200).json({
            token,
        })
    }
}

export const logoutUser = async function (req: Request, res: Response) {
    res.status(200).json({})
}
