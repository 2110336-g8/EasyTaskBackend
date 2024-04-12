export interface TopupSessionStatus {
    status: string;
    customer_email: string;
}

// import mongoose, { Document, Schema, Types } from 'mongoose';

// export interface ITopUp {
//     userId: Types.ObjectId;
//     sessionId: string;
// }

// export interface IChargeDocument extends ICharge, Document {}

// const ChargeSchema = new mongoose.Schema<IChargeDocument>(
//     {
//         taskId: {
//             type: Schema.Types.ObjectId,
//             required: [true, 'Task Id is required'],
//             ref: 'Task',
//         },
//         chargeId: {
//             type: String,
//             required: [true, 'ChargeId is required'],
//         },
//     },
//     {
//         timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
//     },
// );

// export const ChargeModel = mongoose.model<IChargeDocument>('Charge', ChargeSchema);
