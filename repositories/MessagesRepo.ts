import { Service } from 'typedi';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { IMessage, MessageModel } from '../models/MessageModel';
import { FilterQuery, Query } from 'mongoose';

export interface IMessagesRepository extends IRepository<IMessage> {}

@Service()
export class MessagesRepository
    extends BaseMongooseRepository<IMessage>
    implements IMessagesRepository
{
    constructor() {
        super(MessageModel);
    }
}
