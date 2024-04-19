import { Service } from 'typedi';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import {
    ITransfer,
    ITransferDocument,
    TransferModel,
} from '../models/TransferModel';
import { CannotTransferError } from '../errors/TransferError';
import { Types, ClientSession } from 'mongoose';

export interface ITransfersRepository extends IRepository<ITransfer> {
    findOneByTaskId: (taskId: string) => Promise<ITransferDocument | null>;
    startTaskTransfer: (
        customerId: Types.ObjectId,
        taskId: Types.ObjectId,
        amount: number,
        session: ClientSession,
    ) => Promise<ITransferDocument | null>;
    taskPayment: (
        userId: Types.ObjectId,
        taskId: Types.ObjectId,
        amount: number,
        type: string,
        session: ClientSession,
    ) => Promise<ITransferDocument | null>;
}

@Service()
export class TransfersRepository
    extends BaseMongooseRepository<ITransfer>
    implements ITransfersRepository
{
    constructor() {
        super(TransferModel);
    }

    findOneByTaskId = async (
        taskId: string,
    ): Promise<ITransferDocument | null> => {
        const result = await this._model.findOne({ taskId });
        return result;
    };

    // customer wallet -> task
    startTaskTransfer = async (
        customerId: Types.ObjectId,
        taskId: Types.ObjectId,
        amount: number,
        session: ClientSession,
    ): Promise<ITransferDocument | null> => {
        try {
            const transactionOptions = { session };
            const newTransfer: ITransfer = {
                taskId: taskId,
                taskAmount: amount,
                paymentHistory: [
                    {
                        amount: amount,
                        type: 'StartTaskPayment',
                        userId: customerId,
                        timeStamp: new Date(),
                    },
                ],
            };
            const createdTransfer = await this._model.create(
                [newTransfer],
                transactionOptions,
            );
            return createdTransfer[0];
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw new CannotTransferError('Error during increate taskAmount');
        }
    };

    //task -> customer, task -> worker
    taskPayment = async (
        userId: Types.ObjectId,
        taskId: Types.ObjectId,
        amount: number,
        type: string,
        session: ClientSession,
    ): Promise<ITransferDocument | null> => {
        try {
            const transactionOptions = { session };
            const newTransfer = await this._model.findOneAndUpdate(
                { taskId: taskId },
                {
                    $inc: { taskAmount: -amount }, // Use $inc to decrement
                    $push: {
                        paymentHistory: {
                            amount: amount,
                            type: type,
                            userId: userId,
                            timeStamp: new Date(),
                        },
                    },
                },
                { new: true, ...transactionOptions },
            );
            return newTransfer;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw new CannotTransferError('Error during decrease taskAmount');
        }
    };
}
