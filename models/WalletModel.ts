import mongoose, { Document, Types, Schema } from 'mongoose';

export interface IWallet {
    userId: Types.ObjectId;
    walletAmount: number;
    paymentHistory: Array<{
        amount: number;
        type: 'TopUp' | 'StartTaskPayment' | 'Income' | 'Refund';
        taskId?: Types.ObjectId | null;
        timeStamp: Date;
        ref?: String;
    }>;
}

export interface IWalletDocument extends IWallet, Document {}

const WalletSchema = new mongoose.Schema<IWalletDocument>({
    userId: {
        type: Schema.Types.ObjectId,
        required: [true, 'Customer Id is required'],
        ref: 'User',
    },
    walletAmount: { type: Number, default: 0 },
    paymentHistory: [
        {
            amount: { type: Number, required: true },
            type: {
                type: String,
                enum: ['TopUp', 'StartTaskPayment', 'Income', 'Refund'],
                required: true,
            },
            taskId: { type: Types.ObjectId },
            timeStamp: { type: Date, default: Date.now },
            ref: { type: String },
        },
    ],
});

export const WalletModel = mongoose.model<IWalletDocument>(
    'Wallet',
    WalletSchema,
);
