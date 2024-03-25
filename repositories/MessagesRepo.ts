import { Service } from 'typedi';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import {
    IMessage,
    IMessageDocument,
    MessageModel,
} from '../models/MessageModel';
import { Types } from 'mongoose';

export interface IMessagesRepository extends IRepository<IMessage> {
    findMessages(options: {
        taskId: string;
        page: number;
        limit: number;
    }): Promise<IMessageDocument[]>;
    findLatestMessageEachTask(taskIds: string[]): Promise<IMessageDocument[]>;
}

@Service()
export class MessagesRepository
    extends BaseMongooseRepository<IMessage>
    implements IMessagesRepository
{
    constructor() {
        super(MessageModel);
    }
    findMessages = async (options: {
        taskId: string;
        page: number;
        limit: number;
    }): Promise<IMessageDocument[]> => {
        const messages = await this._model
            .find({ taskId: options.taskId })
            .sort({ sentAt: -1 }) // Sorting in descending order of sentAt
            .skip(options.page * options.limit) // Skipping documents based on page number and limit
            .limit(options.limit); // Limiting the number of documents returned per page
        return messages;
    };

    findLatestMessageEachTask = async (
        taskIds: string[],
    ): Promise<IMessageDocument[]> => {
        const messages = await this._model.aggregate([
            {
                $match: {
                    taskId: { $in: taskIds.map(id => new Types.ObjectId(id)) },
                },
            },
            {
                $sort: { taskId: 1, sentAt: -1 },
            },
            {
                $group: {
                    _id: '$taskId',
                    latestMessage: { $first: '$$ROOT' },
                },
            },
            {
                $replaceRoot: { newRoot: '$latestMessage' },
            },
        ]);
        return messages;
    };
}
