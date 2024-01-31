import { Inject, Service } from 'typedi'
import { ILoginInterface } from '../models/AuthModel'
import { AuthService } from '../services/AuthService'
import { UsersService } from '../services/UsersService'
import { Request, Response } from 'express'
import { ValidationError } from '../errors/RepoError'
import { OtpService } from '../services/OtpService'
import { CannotCreateOtpError } from '../errors/OtpError'
import { CannotCreateUserError } from '../errors/UsersError'

@Service()
class AuthController {
    private authService: AuthService
    private otpService: OtpService
    private userService: UsersService

    constructor(
        @Inject() authService: AuthService,
        @Inject() otpService: OtpService,
        @Inject() userService: UsersService,
    ) {
        this.authService = authService
        this.otpService = otpService
        this.userService = userService
    }

    sentOtp = async (req: Request, res: Response): Promise<void> => {
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
            if (
                error instanceof CannotCreateOtpError ||
                error instanceof ValidationError
            ) {
                res.status(403).json({
                    error: error.name,
                    detalis: error.message,
                })
            } else {
                res.status(500).json(error)
            }
        }
    }

    verifyOtp = async (req: Request, res: Response): Promise<void> => {
        const { email, otp } = req.body
        if (!email || !otp) {
            res.status(400).json({
                error: 'Email and OTP are required to send OTP',
            })
            return
        }
        const verifiedOtpDoc = await this.otpService.verifyOtp(email, otp)
        if (!verifiedOtpDoc) {
            res.status(403).json({
                error: 'Failed to verify OTP',
            })
            return
        }
        res.status(200).json({
            message: 'OTP verified successfully',
            email: verifiedOtpDoc.email,
        })
    }

    registerUser = async (req: Request, res: Response): Promise<void> => {
        const data = req.body
        try {
            const user = await this.userService.createUser(data)
            await this.otpService.deleteOtp(user.email)
            const token = this.authService.generateToken(data)
            this.setJwtCookie(res, token)
            res.status(201).json({ user, token })
        } catch (error) {
            if (error instanceof CannotCreateUserError) {
                res.status(403).json({
                    error: error.name,
                    detalis: error.message,
                })
            }
        }
    }

    loginUser = async (req: Request, res: Response): Promise<void> => {
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

    logoutUser = async function (req: Request, res: Response): Promise<void> {
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

    newToken = async (req: Request, res: Response): Promise<void> => {
        const data: ILoginInterface = req.body

        res.status(200).json({
            token: this.authService.generateToken(data, 60),
        })
    }
}

export default AuthController
