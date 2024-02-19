import { ITask, ITaskDocument, TaskModel } from '../models/TaskModel';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { Service } from 'typedi';

export interface ITasksRepository extends IRepository<ITask> {
    findTasksByPage: (
        page: number,
        taskPerPage: number,
    ) => Promise<ITaskDocument[]>;
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
    ): Promise<ITaskDocument[]> => {
        const tasks = await this._model
            .find()
            .skip((page - 1) * taskPerPage)
            .limit(taskPerPage);
        console.log(tasks);
        return tasks;
    };

    async countAllTasks(): Promise<number> {
        const count = await this._model.countDocuments();
        return count;
    }
}
