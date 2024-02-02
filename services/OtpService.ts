import Container, { Inject, Service, Token } from 'typedi';
import { IOtpRepository, OtpRepository } from '../repositories/OtpRepo';
import { IOtpDocument } from '../models/OtpModel';
import { CannotCreateOtpError } from '../errors/OtpError';
import { IUsersRepositorty, UsersRepository } from '../repositories/UsersRepo';
import { IVerifyOtp } from '../models/AuthModel';

export interface IOtpService {
    createOtp: (email: string) => Promise<IOtpDocument>;
    getOtpByEmail: (email: string) => Promise<IOtpDocument | null>;
    verifyOtp: (data: IVerifyOtp) => Promise<IOtpDocument | null>;
    deleteOtp: (email: string) => Promise<boolean>;
}

@Service()
export class OtpService implements IOtpService {
    private otpRepository: IOtpRepository;
    private usersRepository: IUsersRepositorty;

    constructor(
        @Inject(() => OtpRepository)
        otpRepository: IOtpRepository,
        @Inject(() => UsersRepository)
        usersRepository: IUsersRepositorty,
    ) {
        this.otpRepository = otpRepository;
        this.usersRepository = usersRepository;
    }

    async createOtp(email: string): Promise<IOtpDocument> {
        try {
            const existOtp = await this.getOtpByEmail(email);
            const existEmailUser =
                await this.usersRepository.findOneByEmail(email);
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
            const otpDoc = await this.otpRepository.findOneByEmail(email);
            return otpDoc;
        } catch (error) {
            return null;
        }
    }

    async verifyOtp(data: IVerifyOtp): Promise<IOtpDocument | null> {
        const otpDoc = await this.otpRepository.isValidOtp(
            data.email,
            data.otp,
        );
        if (!otpDoc) return null;

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

    async deleteOtp(email: string): Promise<boolean> {
        const otpDoc = await this.getOtpByEmail(email);
        if (!otpDoc) return false;
        const success = await this.otpRepository.deleteOne(otpDoc._id);
        return success;
    }

    async deleteTrashOtp() {
        const otpDocs = await this.otpRepository.findAll();
        otpDocs.forEach((e: IOtpDocument) => {
            const now = new Date();
            const toDelVerify = new Date();
            toDelVerify.setMinutes(toDelVerify.getMinutes() - 30);

            if (e.expiredAt.getTime() > now.getTime()) {
                return;
            }
            if (
                e.isVerified &&
                e.verifiedAt.getTime() > toDelVerify.getTime()
            ) {
                return;
            }
            this.otpRepository.deleteOne(e._id);
        });
    }
}
