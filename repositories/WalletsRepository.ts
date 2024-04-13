import { Service } from 'typedi';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { IWallet, IWalletDocument, WalletModel } from '../models/WalletModel';

export interface IWalletsRepository extends IRepository<IWallet> {
    findOneByUserId: (userId: string) => Promise<IWalletDocument | null>;
}

@Service()
export class WalletsRepository
    extends BaseMongooseRepository<IWallet>
    implements IWalletsRepository
{
    constructor() {
        super(WalletModel);
    }
    findOneByUserId = async (
        userId: string,
    ): Promise<IWalletDocument | null> => {
        const result = await this._model.findOne({ userId });
        return result;
    };
}
