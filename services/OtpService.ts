import Container, { Inject, Service, Token } from 'typedi';
import { OtpRepository } from '../repositories/OtpRepo';
import { IOtpDocument } from '../models/OtpModel';
import { CannotCreateOtpError } from '../errors/OtpError';
import { UsersRepository } from '../repositories/UsersRepo';
import { IVerifyOtp } from '../models/AuthModel';
import { IRepository } from '../repositories/BaseRepo';
import { IUserDocument } from '../models/UserModel';

@Service()
export class OtpService {
    private otpRepository: IRepository<IOtpDocument>;
    private usersRepository: IRepository<IUserDocument>;

    constructor(
        @Inject(() => OtpRepository)
        otpRepository: IRepository<IOtpDocument>,
        @Inject(() => UsersRepository)
        usersRepository: IRepository<IUserDocument>,
    ) {
        this.otpRepository = otpRepository;
        this.usersRepository = usersRepository;
    }

    async createOtp(email: string): Promise<IOtpDocument> {
        try {
            const existOtp = await this.getOtpByEmail(email);
            const existEmailUser = await this.usersRepository.findOne({
                email,
            });
            if (existEmailUser) {
                throw new CannotCreateOtpError('Email is already used');
            }
            if (existOtp) {
                const expiredAt = existOtp.expiredAt.getTime();
                const now = new Date().getTime();
                if (expiredAt - now < 4 * 60 * 1000) {
                    await this.deleteOtp(email);
                } else {
                    throw new CannotCreateOtpError(
                        'This email alredy generated otp less than 1 min, Please try again later',
                    );
                }
            }
            const otpDoc = await this.otpRepository.create({
                email,
            } as IOtpDocument);
            return otpDoc;
        } catch (error) {
            throw error;
        }
    }

    async getOtpByEmail(email: string): Promise<IOtpDocument | null> {
        try {
            const otpDoc = await this.otpRepository.findOne({ email });
            return otpDoc;
        } catch (error) {
            return null;
        }
    }

    async verifyOtp(data: IVerifyOtp): Promise<IOtpDocument | null> {
        const otpDoc = await this.getOtpByEmail(data.email);
        if (!otpDoc) return null;

        const valid = otpDoc.isValidOtp(data.otp);
        if (!valid) return null;

        const id = otpDoc._id;
        try {
            const verifiedOtpDoc = await this.otpRepository.update(id, {
                isVerified: true,
                verifiedAt: new Date(),
            } as IOtpDocument);
            return verifiedOtpDoc;
        } catch (error) {
            return null;
        }
    }

    async isVerifiedOtp(email: string): Promise<boolean> {
        const otpDoc = await this.getOtpByEmail(email);
        if (!otpDoc) return false;
        else {
            return otpDoc.isVerified;
        }
    }

    async deleteOtp(email: string): Promise<boolean> {
        const otpDoc = await this.getOtpByEmail(email);
        if (!otpDoc) return false;
        const success = await this.otpRepository.deleteOne(otpDoc._id);
        return success;
    }
}
