import { Document, Schema, Types, model } from 'mongoose';

export interface IMessage {
    taskId: Types.ObjectId;
    senderType: 'sys' | 'user';
    senderId?: Types.ObjectId;
    sentAt: Date;
    text: {
        title?: string;
        content?: string;
    };
}

export interface IMessageDocument extends IMessage, Document {}

const MessageSchema = new Schema({
    taskId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Task',
    },
    senderType: {
        type: String,
        enum: ['sys', 'user'],
        required: true,
    },
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    sentAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    text: {
        title: {
            type: String,
        },
        content: {
            type: String,
        },
    },
});

export const MessageModel = model<IMessageDocument>('Message', MessageSchema);
