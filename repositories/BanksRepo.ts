import { Service } from 'typedi';
import { BankModel, IBank } from '../models/BankModel';
import { BaseMongooseRepository, IRepository } from './BaseRepo';

export interface IBanksRepository extends IRepository<IBank> {}

@Service()
export class BanksRepository
    extends BaseMongooseRepository<IBank>
    implements IBanksRepository
{
    constructor() {
        super(BankModel);
    }
}
