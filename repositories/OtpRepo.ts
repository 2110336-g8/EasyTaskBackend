import { Service } from 'typedi';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { IOtpDocument, OtpModel } from '../models/OtpModel';

export interface IOtpRepository extends IRepository<IOtpDocument> {
    findOneByEmail: (email: string) => Promise<IOtpDocument | null>;
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
}
