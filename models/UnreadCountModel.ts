import { Document, Schema, Types, model } from 'mongoose';

export interface IUnreadCount {
    userId: Types.ObjectId;
    taskId: Types.ObjectId;
    count: number;
}

export interface IUnreadCountDocument extends IUnreadCount, Document {}

const UnreadCountSchema = new Schema<IUnreadCountDocument>({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    taskId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Task',
    },
    count: {
        type: Number,
        required: true,
        default: 0,
    },
});

export const UnreadCountModel = model<IUnreadCountDocument>(
    'UnreadCount',
    UnreadCountSchema,
);
