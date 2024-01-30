import { Inject, Service } from 'typedi'
import { ILoginInterface } from '../models/AuthModel'
import AuthService from '../services/AuthService'
import UsersService from '../services/UsersService'
import { Request, Response } from 'express'
import { ValidationError } from '../errors/RepoError'
import { IUserDocument } from '../models/UserModel'

@Service()
class AuthController {
    private authService: AuthService
    private usersService: UsersService

    constructor(
        @Inject() authService: AuthService,
        @Inject() usersService: UsersService,
    ) {
        this.authService = authService
        this.usersService = usersService
    }

    registerUser = async (req: Request, res: Response) => {
        try {
            const data = req.body
            const user = await this.usersService.createUser(data)
            const loginData: ILoginInterface = user
            const token = this.authService.generateToken(loginData)
            this.setJwtCookie(res, token)
            res.status(201).json({
                user,
                token,
            })
        } catch (error) {
            if (error instanceof ValidationError) {
                res.status(400).json({
                    error: error.name,
                    details: error.message,
                })
            } else {
                res.status(500).json({ error: 'Internal server error' })
            }
        }
    }

    loginUser = async (req: Request, res: Response) => {
        const data: ILoginInterface = req.body
        const validUserPassword = await this.authService.verifyUser(data)

        if (!validUserPassword) {
            res.status(401).json({
                message: 'Unauthorized',
            })
        } else {
            const token = this.authService.generateToken(data)
            this.setJwtCookie(res, token)
            res.status(200).json({
                token,
            })
        }
    }

    logoutUser = async function (req: Request, res: Response) {
        res.status(200).json({})
    }

    private setJwtCookie = (
        res: Response,
        token: string,
        cookieName: string = 'jwt',
        expirationInMinutes: number = parseInt(process.env.JWT_EXP_MIN || '60'),
    ): void => {
        const expirationDate = new Date()
        expirationDate.setTime(
            expirationDate.getTime() + expirationInMinutes * 60 * 1000,
        )

        res.cookie(cookieName, token, {
            httpOnly: true,
            expires: expirationDate,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        })
    }

    newToken = async (req: Request, res: Response) => {
        const data: ILoginInterface = req.body

        res.status(200).json({
            token: this.authService.generateToken(data, 60),
        })
    }
}

export default AuthController

// /**
//  * Generate new token from phoneNumber of login info.
//  *
//  * @param req
//  * @param res
//  */
// export const newToken = async function (req: Request, res: Response) {
//     const data: ILoginInterface = req.body

//     res.status(200).json({
//         token: AuthService.generateToken(data, 60),
//     })

//     registerUser = async (req: Request, res: Response) => {
//         try {
//             const userData = req.body
//             const newUser: IUserDocument = await UserService.CreateUser(
//                 userData,
//             )
//             const loginData: ILoginInterface = newUser
//             const token = AuthService.generateToken(loginData)
//             setJwtCookie(res, token)
//             res.status(201).json({
//                 user: newUser,
//                 token,
//             })
//         } catch (error) {
//             if (error instanceof UserValidationError) {
//                 res.status(400).json({
//                     error: error.name,
//                     details: error.message,
//                 })
//             } else {
//                 res.status(500).json({ error: 'Internal server error' })
//             }
//         }
//     }
// }

// export const checkValidateToken = async function (req: Request, res: Response) {
//     if ('decodedToken' in res.locals) {
//         const decodedToken = res.locals.decodedToken

//         res.status(200).json({
//             message: decodedToken,
//         })
//     } else {
//         res.status(401).json({
//             message: 'Unauthorized',
//         })
//     }
// }
