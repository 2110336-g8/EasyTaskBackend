import mongoose from 'mongoose';
import { Document } from 'mongoose';

export interface IBank {
    name: String;
}

export interface IBankDocument extends IBank, Document {}

const BankSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Bank name is required'],
            unique: true,
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    },
);

export const BankModel = mongoose.model<IBankDocument>('Bank', BankSchema);
