import { Service } from 'typedi';
import { IUnreadCount, UnreadCountModel } from '../models/UnreadCountModel';
import { BaseMongooseRepository, IRepository } from './BaseRepo';

export interface IUnreadCountRepository extends IRepository<IUnreadCount> {
    incrementUnread: (taskId: string, userIds: string[]) => Promise<void>;
    resetUnread: (taskId: string, userId: string) => Promise<void>;
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
        await this._model.updateMany(
            { taskId, userId: { $in: userIds } },
            { $inc: { count: 1 } },
        );
    }
    async resetUnread(taskId: string, userId: string): Promise<void> {
        await this._model.updateMany(
            { taskId, userId },
            { $set: { count: 0 } },
        );
    }
}
