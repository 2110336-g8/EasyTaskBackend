import { Service } from 'typedi'
import { BaseMongooseRepository } from './_BaseRepo'
import { IOtpDocument, OtpModel } from '../models/OtpModel'

@Service()
export class OtpRepository extends BaseMongooseRepository<IOtpDocument> {
    constructor() {
        super(OtpModel)
    }
}
