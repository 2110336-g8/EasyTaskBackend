import { Service } from 'typedi';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { IWallet, IWalletDocument, WalletModel } from '../models/WalletModel';

export interface IWalletsRepository extends IRepository<IWallet> {
    findOneByUserId: (userId: string) => Promise<IWalletDocument | null>;
    addTopupHistory: (
        userId: string,
        amount: number,
        sessionId: string,
    ) => Promise<IWalletDocument | null>;
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

    addTopupHistory = async (
        userId: string,
        amount: number,
        sessionId: string,
    ): Promise<IWalletDocument | null> => {
        try {
            const updatedWallet = await this._model.findOneAndUpdate(
                { userId },
                {
                    $inc: { walletAmount: amount },
                    $push: {
                        paymentHistory: {
                            amount: amount,
                            type: 'TopUp',
                            ref: sessionId,
                        },
                    },
                },
                { new: true },
            );
            return updatedWallet;
        } catch (error) {
            console.error('Error adding top up history:', error);
            throw error;
        }
    };
}
