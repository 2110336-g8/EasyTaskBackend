import mongoose, { Types, Document } from 'mongoose';

export interface IMail {
    receiverEmail: string;
    taskId: Types.ObjectId | undefined;
    subject: string;
    textPart: string;
    htmlPart: string;
    createAt: Date;
    sendAt: Date;
}

export interface IMailDocument extends IMail, Document {}

const MailSchema = new mongoose.Schema<IMailDocument>({
    receiverEmail: {
        type: String,
        require: [true, 'Email is required'],
        validate: {
            validator: function (v: string) {
                return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
            },
            message: 'Invalid email format',
        },
    },
    taskId: {
        type: Types.ObjectId,
    },
    subject: {
        type: String,
        required: true,
    },
    textPart: {
        type: String,
        required: true,
    },
    htmlPart: {
        type: String,
        required: true,
    },
    createAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
    sendAt: {
        type: Date,
    },
});

export const MailModel = mongoose.model<IMailDocument>('Mail', MailSchema);
