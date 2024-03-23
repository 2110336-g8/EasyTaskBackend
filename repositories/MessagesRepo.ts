import { Service } from 'typedi';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { IMessage, MessageModel } from '../models/MessageModel';

export interface IMessagesRepository extends IRepository<IMessage> {
    findMessages(options: {
        taskId: string;
        page: number;
        limit: number;
    }): Promise<IMessage[]>;
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
    }): Promise<IMessage[]> => {
        const messages = await this._model
            .find({ taskId: options.taskId })
            .sort({ createdAt: -1 }) // Sorting in descending order of createdAt
            .skip(options.page * options.limit) // Skipping documents based on page number and limit
            .limit(options.limit); // Limiting the number of documents returned per page
        return messages;
    };
}
