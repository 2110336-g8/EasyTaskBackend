import { ITask, ITaskDocument, TaskModel } from '../models/TaskModel';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { Service } from 'typedi';

export interface ITasksRepository extends IRepository<ITask> {
    findTasksByPage: (page: number, taskPerPage: number) => Promise<ITaskDocument[]>;
}

@Service()
export class TasksRepository
    extends BaseMongooseRepository<ITask>
    implements ITasksRepository
{
    constructor() {
        super(TaskModel);
    }

    async findTasksByPage(page: number, taskPerPage: number): Promise<ITaskDocument[]> {
        const tasks = 
            await this._model.find();
            console.log(tasks); 
        return tasks;
    }
}




