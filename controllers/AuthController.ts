import { Inject, Service } from 'typedi';
import { ILogin, IVerifyOtp } from '../models/AuthModel';
import { AuthService, IAuthService } from '../services/AuthService';
import { IUsersService, UsersService } from '../services/UsersService';
import { Request, Response } from 'express';
import { ValidationError } from '../errors/RepoError';
import { IOtpService, OtpService } from '../services/OtpService';
import { CannotCreateUserError } from '../errors/UsersError';
import { IEmailService, MailJetService } from '../services/EmailService';
import { CannotSendEmailError } from '../errors/EmailError';
import { CannotCreateOtpError } from '../errors/OtpError';

@Service()
class AuthController {
    private authService: IAuthService;
    private otpService: IOtpService;
    private userService: IUsersService;
    private emailService: IEmailService;

    constructor(
        @Inject(() => AuthService) authService: IAuthService,
        @Inject(() => OtpService) otpService: IOtpService,
        @Inject(() => UsersService) userService: IUsersService,
        @Inject(() => MailJetService) emailService: IEmailService,
    ) {
        this.authService = authService;
        this.otpService = otpService;
        this.userService = userService;
        this.emailService = emailService;
    }

    sentOtp = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email } = req.body;
            const createdOtp = await this.otpService.createOtp(email);

            const isSent = await this.emailService.sendOtp(createdOtp);

            if (!isSent) {
                this.handleError(res, new Error());
                return;
            }

            res.status(201).json({
                success: true,
                messsage: `Sent OTP to ${createdOtp.email} successfully`,
                ref: createdOtp.reference,
            });
        } catch (error) {
            this.handleError(res, error);
        }
    };

    verifyOtp = async (req: Request, res: Response): Promise<void> => {
        const data: IVerifyOtp = req.body;
        const verifiedOtpDoc = await this.otpService.verifyOtp(data);
        if (!verifiedOtpDoc) {
            res.status(403).json({
                error: 'Failed to verify OTP',
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            email: verifiedOtpDoc.email,
        });
    };

    registerUser = async (req: Request, res: Response): Promise<void> => {
        const data = req.body;
        try {
            const user = await this.userService.createUser(data);
            await this.otpService.deleteOtp(user.email);
            const token = this.authService.generateToken(data);
            this.setJwtCookie(res, token);
            res.status(201).json({
                success: true,
                message: 'Register and logged in',
                token,
                user,
            });
        } catch (error) {
            if (error instanceof CannotCreateUserError) {
                res.status(403).json({
                    error: error.name,
                    detalis: error.message,
                });
            }
        }
    };

    loginUser = async (req: Request, res: Response): Promise<void> => {
        const data: ILogin = req.body;
        const user = await this.authService.verifyUser(data);
        if (!user) {
            this.respondUnAuth(res);
        } else {
            const token = this.authService.generateToken(data);
            this.setJwtCookie(res, token);
            res.status(200).json({
                success: true,
                message: 'Logged in',
                token,
                user,
            });
        }
    };

    logoutUser = async function (req: Request, res: Response): Promise<void> {
        res.status(200).json({});
    };

    private setJwtCookie = (
        res: Response,
        token: string,
        cookieName: string = 'jwt',
        expirationInMinutes: number = parseInt(process.env.JWT_EXP_MIN || '60'),
    ): void => {
        const expirationDate = new Date();
        expirationDate.setTime(
            expirationDate.getTime() + expirationInMinutes * 60 * 1000,
        );

        res.cookie(cookieName, token, {
            httpOnly: true,
            expires: expirationDate,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });
    };

    newToken = async (req: Request, res: Response): Promise<void> => {
        const data: ILogin = req.body;

        res.status(200).json({
            success: true,
            token: this.authService.generateToken(data, 60),
        });
    };

    private handleError(res: Response, error: any) {
        if (
            error instanceof CannotCreateUserError ||
            error instanceof CannotCreateOtpError
        ) {
            res.status(403).json({
                error: error.name,
                details: error.message,
            });
        } else if (error instanceof ValidationError) {
            res.status(400).json({
                error: error.name,
                details: error.message,
            });
        } else if (error instanceof CannotSendEmailError) {
            res.status(500).json({
                error: error.name,
                details: error.message,
            });
        } else {
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    private respondUnAuth(res: Response) {
        res.status(401).json({
            error: 'Unauthorized',
        });
    }
}

export default AuthController;
