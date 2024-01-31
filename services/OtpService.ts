import { Inject, Service } from 'typedi'
import { OtpRepository } from '../repositories/OtpRepo'
import { IOtpDocument } from '../models/OtpModel'
import { CannotCreateOtpError } from '../errors/OtpError'
import UsersService from './UsersService'

@Service()
export default class OtpService {
    private otpRepository: OtpRepository
    private usersService: UsersService

    constructor(
        @Inject() otpRepository: OtpRepository,
        @Inject() usersService: UsersService,
    ) {
        this.otpRepository = otpRepository
        this.usersService = usersService
    }

    async createOtp(email: string): Promise<IOtpDocument> {
        try {
            const existOtp = await this.getOtpByEmail(email)
            const existEmailUser = await this.usersService.getUserByEmail(email)
            if (existEmailUser) {
                throw new CannotCreateOtpError('This email already has a user')
            }
            if (existOtp) {
                const expiredAt = existOtp.expiredAt.getTime()
                const now = new Date().getTime()
                if (expiredAt - now < 4 * 60 * 1000) {
                    await this.deleteOtp(email)
                } else {
                    throw new CannotCreateOtpError(
                        'This email alredy generated otp less than 1 min, Please try again later',
                    )
                }
            }
            const otpDoc = await this.otpRepository.create({
                email,
            } as IOtpDocument)
            return otpDoc
        } catch (error) {
            throw error
        }
    }

    async getOtpByEmail(email: string): Promise<IOtpDocument | null> {
        try {
            const otpDoc = await this.otpRepository.findOne({ email })
            return otpDoc
        } catch (error) {
            return null
        }
    }

    async verifyOtp(email: string, otp: string): Promise<IOtpDocument | null> {
        const otpDoc = await this.getOtpByEmail(email)
        if (!otpDoc) return null

        const valid = otpDoc.isValidOtp(otp)
        if (!valid) return null

        const id = otpDoc._id
        try {
            const verifiedOtpDoc = await this.otpRepository.update(id, {
                isVerified: true,
                verifiedAt: new Date(),
            } as IOtpDocument)
            return verifiedOtpDoc
        } catch (error) {
            return null
        }
    }

    async isVerifiedOtp(email: string): Promise<boolean> {
        const otpDoc = await this.getOtpByEmail(email)
        if (!otpDoc) return false
        else {
            return otpDoc.isVerified
        }
    }

    async deleteOtp(email: string): Promise<boolean> {
        const otpDoc = await this.getOtpByEmail(email)
        if (!otpDoc) return false
        const success = await this.otpRepository.deleteOne(otpDoc._id)
        return success
    }
}
