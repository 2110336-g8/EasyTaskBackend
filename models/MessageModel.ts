import { Document, Schema, Types, model } from 'mongoose';

export interface IMessage {
    taskId: Types.ObjectId;
    senderType: 'sys' | 'user';
    senderId?: Types.ObjectId;
    text: {
        title?: string;
        content?: string;
    };
}

export interface IMessageDocument extends IMessage, Document {}

const MessageSchema = new Schema(
    {
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
        sender: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        text: {
            title: {
                type: String,
            },
            content: {
                type: String,
            },
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    },
);

export const MessageModel = model<IMessageDocument>('Message', MessageSchema);
