import { Service } from 'typedi';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { IMail, IMailDocument, MailModel } from '../models/MailModel';

export interface IMailRepository extends IRepository<IMail> {}

@Service()
export class MailRepository
    extends BaseMongooseRepository<IMail>
    implements IMailRepository
{
    constructor() {
        super(MailModel);
    }
}
