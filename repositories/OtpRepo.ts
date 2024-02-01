import { Service } from 'typedi';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { IOtpDocument, OtpModel } from '../models/OtpModel';

export interface IOtpRepository extends IRepository<IOtpDocument> {
    findOneByEmail: (email: string) => Promise<IOtpDocument | null>;
    deleteExpiredOtps(): Promise<number>;
}

@Service()
export class OtpRepository
    extends BaseMongooseRepository<IOtpDocument>
    implements IOtpRepository
{
    constructor() {
        super(OtpModel);
    }
    async findOneByEmail(email: string): Promise<IOtpDocument | null> {
        const result = await this._model.findOne({ email });
        return result;
    }
    async deleteExpiredOtps(): Promise<number> {
        try {
            const now = new Date();
            const thirtyMinutesAgo = new Date();
            thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() + 30);
            const result = await OtpModel.deleteMany({
                $or: [
                    { expiredAt: { $gt: now } }, // Delete documents where expiredAt > now
                    {
                        $and: [
                            { verifiedAt: { $exists: true } }, // Ensure verifiedAt field exists
                            { verifiedAt: { $lt: thirtyMinutesAgo } }, // Delete documents where now - verifiedAt < 30 mins
                        ],
                    },
                ],
            });
            return result.deletedCount;
        } catch (error) {
            return 0;
        }
    }
}
