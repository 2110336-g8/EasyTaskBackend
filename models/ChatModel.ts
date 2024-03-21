import { Document, ObjectId, Schema, model } from 'mongoose';

export interface IChat {
    sender: ObjectId;
    sentAt: Date;
    message: string;
}

export interface IChatRoom {
    taskId: ObjectId;
    chats: Array<IChat>;
}

export interface IChatRoomDocument extends IChatRoom, Document {}

const ChatRoomSchema = new Schema({
    taskId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    chats: [
        {
            sender: {
                type: Schema.Types.ObjectId,
                required: true,
            },
            sentAt: {
                type: Date,
                default: Date.now,
                required: true,
            },
            message: {
                type: String,
                required: true,
            },
        },
    ],
});

export const ChatRoomModel = model<IChatRoomDocument>(
    'ChatRoom',
    ChatRoomSchema,
);
