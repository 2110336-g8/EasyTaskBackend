import { Service } from 'typedi';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { IWallet, IWalletDocument, WalletModel } from '../models/WalletModel';
import {
    NotEnoughMoneyError,
    CustomerWalletNotFoundError,
    UserWalletNotFoundError,
} from '../errors/WalletError';
import { ClientSession, Types } from 'mongoose';
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
    payStartTask: (
        customerId: Types.ObjectId,
        taskId: Types.ObjectId,
        amount: number,
        session: ClientSession,
    ) => Promise<IWalletDocument | null>;
    taskIncome: (
        userId: Types.ObjectId,
        taskId: Types.ObjectId,
        amount: number,
        type: string,
        session: ClientSession,
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
        try {
            const result = await this._model.findOne({ userId });
            if (!result) {
                throw new UserWalletNotFoundError('user wallet not found');
            }
            return result;
        } catch (error) {
            console.error(error);
            throw error;
        }
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

    // customer wallet-> task
    payStartTask = async (
        customerId: Types.ObjectId,
        taskId: Types.ObjectId,
        amount: number,
        session: ClientSession,
    ): Promise<IWalletDocument | null> => {
        try {
            const customerWallet = await this.findOneByUserId(
                customerId.toString(),
            );
            console.log(customerWallet);
            if (!customerWallet) {
                throw new CustomerWalletNotFoundError(
                    'customer wallet not found',
                );
            }
            const walletAmount = customerWallet.walletAmount;
            if (walletAmount < amount) {
                throw new NotEnoughMoneyError(
                    'Customer does not have enough money in wallet',
                );
            }
            //transfer wallet -> task
            const updatedWallet = await this._model.findOneAndUpdate(
                { userId: customerId },
                {
                    $inc: { walletAmount: -amount }, // Use $inc to decrement
                    $push: {
                        paymentHistory: {
                            amount: amount,
                            type: 'StartTaskPayment',
                            taskId: taskId,
                            timeStamp: new Date(),
                        },
                    },
                },
                { new: true },
            );

            return updatedWallet;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    };

    //task -> customer wallet, task -> worker wallet
    taskIncome = async (
        userId: Types.ObjectId,
        taskId: Types.ObjectId,
        amount: number,
        type: string,
        session: ClientSession,
    ): Promise<IWalletDocument | null> => {
        try {
            const userWallet = await this.findOneByUserId(userId.toString());
            if (!userWallet) {
                throw new UserWalletNotFoundError('user wallet not found');
            }
            const transactionOptions = { session };
            //transfer wallet -> task
            const updatedWallet = await this._model.findOneAndUpdate(
                { userId: userId },
                {
                    $inc: { walletAmount: amount },
                    $push: {
                        paymentHistory: {
                            amount: amount,
                            type: type,
                            taskId: taskId,
                            timeStamp: new Date(),
                        },
                    },
                },
                { new: true },
            );

            return updatedWallet;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    };
}
