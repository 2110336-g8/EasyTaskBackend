import mongoose, { Document, Types, Schema } from 'mongoose';

export interface ITransfer {
    taskId: Types.ObjectId;
    taskAmount: number;
    paymentHistory: Array<{
        amount: number;
        type:
            | 'StartTaskPayment'
            | 'WorkerPayment'
            | 'SubmittedWorkerCompensation'
            | 'NotSubmittedWorkerCompensation'
            | 'CustomerRefund';
        userId?: Types.ObjectId | null;
        timeStamp: Date;
        ref?: String;
    }>;
}

export interface ITransferDocument extends ITransfer, Document {}

const TransferSchema = new mongoose.Schema<ITransferDocument>({
    taskId: {
        type: Schema.Types.ObjectId,
        required: [true, 'Customer Id is required'],
        ref: 'User',
    },
    taskAmount: { type: Number, default: 0 },
    paymentHistory: [
        {
            amount: { type: Number, required: true },
            type: {
                type: String,
                enum: [
                    'StartTaskPayment',
                    'WorkerPayment',
                    'SubmittedWorkerCompensation',
                    'NotSubmittedWorkerCompensation',
                    'CustomerRefund',
                ],
                required: true,
            },
            userId: { type: Types.ObjectId },
            timeStamp: { type: Date, default: Date.now },
            ref: { type: String },
        },
    ],
});

export const TransferModel = mongoose.model<ITransferDocument>(
    'Transfer',
    TransferSchema,
);
