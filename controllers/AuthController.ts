import { Inject, Service } from 'typedi'
import { ILoginInterface } from '../models/AuthModel'
import AuthService from '../services/AuthService'
import UsersService from '../services/UsersService'
import { Request, Response } from 'express'
import { ValidationError } from '../errors/RepoError'
import OtpService from '../services/OtpService'
import { CannotCreateOtpError } from '../errors/OtpError'

@Service()
class AuthController {
    private authService: AuthService
    private otpService: OtpService

    constructor(
        @Inject() authService: AuthService,
        @Inject() otpService: OtpService,
    ) {
        this.authService = authService
        this.otpService = otpService
    }

    sentOtp = async (req: Request, res: Response) => {
        try {
            const { email } = req.body
            if (!email) {
                res.status(400).json({
                    error: 'Email is required to send OTP',
                })
                return
            }
            const createdOtp = await this.otpService.createOtp(email)

            // TODO : send Email

            res.status(201).json({
                messsage: `Sent OTP to ${createdOtp.email} successfully`,
            })
        } catch (error) {
            if (error instanceof CannotCreateOtpError) {
                res.status(403).json(error)
            }
        }
    }

    registerUser = async (req: Request, res: Response) => {
        // TO FIX
        // try {
        //     const data = req.body
        //     const user = await this.usersService.createUser(data)
        //     const loginData: ILoginInterface = user as ILoginInterface
        //     const token = this.authService.generateToken(loginData)
        //     this.setJwtCookie(res, token)
        //     res.status(201).json({
        //         user,
        //         token,
        //     })
        // } catch (error) {
        //     if (error instanceof ValidationError) {
        //         res.status(400).json({
        //             error: error.name,
        //             details: error.message,
        //         })
        //     } else {
        //         res.status(500).json({ error: 'Internal server error' })
        //     }
        // }
    }

    loginUser = async (req: Request, res: Response) => {
        // TO FIX
        // const data: ILoginInterface = req.body
        // const validUserPassword = await this.authService.verifyUser(data)
        // if (!validUserPassword) {
        //     res.status(401).json({
        //         message: 'Unauthorized',
        //     })
        // } else {
        //     const token = this.authService.generateToken(data)
        //     this.setJwtCookie(res, token)
        //     res.status(200).json({
        //         token,
        //     })
        // }
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
