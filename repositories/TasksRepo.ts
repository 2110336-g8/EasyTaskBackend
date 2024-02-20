import { ITask, ITaskDocument, TaskModel } from '../models/TaskModel';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { Service } from 'typedi';
import { FilterQuery } from 'mongoose';

export interface ITasksRepository extends IRepository<ITask> {
    findTasksByPage: (
        page: number,
        taskPerPage: number,
        filter?: FilterQuery<ITaskDocument>,
    ) => Promise<{ tasks: ITaskDocument[]; count: number }>;
    countAllTasks: () => Promise<number | null>;
}

@Service()
export class TasksRepository
    extends BaseMongooseRepository<ITask>
    implements ITasksRepository
{
    constructor() {
        super(TaskModel);
    }

    findTasksByPage = async (
        page: number,
        taskPerPage: number,
        filter: FilterQuery<ITaskDocument> = {},
    ): Promise<{ tasks: ITaskDocument[]; count: number }> => {
        const tasks = await this._model
            .find(filter)
            .skip((page - 1) * taskPerPage)
            .limit(taskPerPage);

        const count = await this._model.countDocuments(filter);

        return { tasks, count };
    };

    async countAllTasks(): Promise<number> {
        const count = await this._model.countDocuments();
        return count;
    }
}
