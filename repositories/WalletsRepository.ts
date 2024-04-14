import { Service } from 'typedi';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { IWallet, IWalletDocument, WalletModel } from '../models/WalletModel';
import { FilterQuery } from 'mongoose';
import { gte } from 'lodash';
const { Types } = require('mongoose');

export interface IWalletsRepository extends IRepository<IWallet> {
    findOneByUserId: (userId: string) => Promise<IWalletDocument | null>;
    addTopupHistory: (
        userId: string,
        amount: number,
        sessionId: string,
    ) => Promise<IWalletDocument | null>;
    getWalletHistory: (
        userId: string,
        page: number,
        limit: number,
    ) => Promise<{
        walletHistory: IWalletDocument['paymentHistory'];
        count: number;
    }>;
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

    getWalletHistory = async (
        userId: string,
        page: number = 1,
        limit: number = 10,
    ): Promise<{
        walletHistory: IWalletDocument['paymentHistory'];
        count: number;
    }> => {
        const aggregationPipeline: any[] = [
            {
                $match: {
                    userId: new Types.ObjectId(userId),
                },
            },
            {
                $unwind: '$paymentHistory',
            },
            {
                $project: {
                    _id: 0,
                    paymentHistory: 1,
                },
            },
            {
                $addFields: {
                    amount: '$paymentHistory.amount',
                    type: '$paymentHistory.type',
                    taskId: '$paymentHistory.taskId',
                    ref: '$paymentHistory.ref',
                    _id: '$paymentHistory._id',
                    timeStamp: { $toDate: '$paymentHistory.timeStamp' },
                },
            },
            {
                $project: {
                    paymentHistory: 0,
                },
            },
            { $sort: { timeStamp: -1 } },
            {
                $facet: {
                    walletHistory: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                    ],
                    totalCount: [{ $count: 'count' }],
                },
            },
        ];
        try {
            const result = await this._model.aggregate(aggregationPipeline);
            const count =
                result[0].totalCount.length > 0
                    ? result[0].totalCount[0].count
                    : 0;
            return { walletHistory: result[0].walletHistory, count };
        } catch (error) {
            console.error('Error get history:', error);
            throw error;
        }
    };
}
