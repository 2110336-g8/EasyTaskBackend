import { Document, ObjectId, Schema, model } from 'mongoose';

export interface IMessage {
    senderType: 'sys' | 'user';
    senderId?: ObjectId;
    sentAt: Date;
    message: {
        title?: string;
        content?: string;
    };
}

export interface IChatRoom {
    taskId: ObjectId;
    message: IMessage[];
}

export interface IChatRoomDocument extends IChatRoom, Document {}

const ChatRoomSchema = new Schema({
    taskId: {
        type: Schema.Types.ObjectId,
        required: true,
        unique: true,
        ref: 'Task',
    },
    chats: [
        {
            senderType: {
                type: String,
                enum: ['sys', 'user'],
                required: true,
            },
            sender: {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
            sentAt: {
                type: Date,
                default: Date.now,
                required: true,
            },
            message: {
                title: {
                    type: String,
                },
                message: {
                    type: String,
                },
            },
        },
    ],
});

export const ChatRoomModel = model<IChatRoomDocument>(
    'ChatRoom',
    ChatRoomSchema,
);
