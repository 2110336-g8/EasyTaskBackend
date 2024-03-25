import { Service } from 'typedi';
import {
    IUnreadCount,
    IUnreadCountDocument,
    UnreadCountModel,
} from '../models/UnreadCountModel';
import { BaseMongooseRepository, IRepository } from './BaseRepo';

export interface IUnreadCountRepository extends IRepository<IUnreadCount> {
    incrementUnread: (taskId: string, userIds: string[]) => Promise<void>;
    resetUnread: (taskId: string, userId: string) => Promise<void>;
    getUnreadCountByUserId: (userId: string) => Promise<IUnreadCountDocument[]>;
}

@Service()
export default class UnreadCountRepository
    extends BaseMongooseRepository<IUnreadCount>
    implements IUnreadCountRepository
{
    constructor() {
        super(UnreadCountModel);
    }
    async incrementUnread(taskId: string, userIds: string[]): Promise<void> {
        for (const userId of userIds) {
            await this._model.updateOne(
                { taskId, userId }, // Filter criteria
                { $inc: { count: 1 } }, // Increment count by 1
                { upsert: true }, // Create a new document if it doesn't exist
            );
        }
    }
    async resetUnread(taskId: string, userId: string): Promise<void> {
        await this._model.updateMany(
            { taskId, userId },
            { $set: { count: 0 } },
        );
    }

    async getUnreadCountByUserId(
        userId: string,
    ): Promise<IUnreadCountDocument[]> {
        return await this._model.find({ userId });
    }
}
