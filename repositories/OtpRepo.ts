import { Service } from 'typedi';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { IOtp, IOtpDocument, OtpModel } from '../models/OtpModel';

export interface IOtpRepository extends IRepository<IOtp> {
    findOneByEmail: (email: string) => Promise<IOtpDocument | null>;
    isValidOtp: (email: string, otp: string) => Promise<IOtpDocument | null>;
}

@Service()
export class OtpRepository
    extends BaseMongooseRepository<IOtp>
    implements IOtpRepository
{
    constructor() {
        super(OtpModel);
    }
    async findOneByEmail(email: string): Promise<IOtpDocument | null> {
        const result = await this._model.findOne({ email });
        return result;
    }

    async isValidOtp(email: string, otp: string): Promise<IOtpDocument | null> {
        const otpDoc = await this._model.findOne({ email });
        if (!otpDoc) {
            return null;
        }
        const isMatched = otpDoc.otp === otp;
        const isExpired = otpDoc.expiredAt.getTime() < new Date().getTime();
        return isMatched && !isExpired ? otpDoc : null;
    }
}
