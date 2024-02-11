import { ITask, ITaskDocument, TaskModel } from '../models/TaskModel';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { Service } from 'typedi';

export interface ITaskRepository extends IRepository<ITask> {
<<<<<<< HEAD
    findTaskByPage(page: number, taskPerPage: number): Promise<ITaskDocument[]>;
=======
    findTasksByPage(page: number, taskPerPage: number): Promise<ITaskDocument[]>;
>>>>>>> 22f550d (Refactor tasks pagination and update tasks service)
}

@Service()
export class TasksRepository
    extends BaseMongooseRepository<ITask>
    implements ITaskRepository
{
    constructor() {
        super(TaskModel);
    }

    async findTasksByPage(page: number, taskPerPage: number): Promise<ITaskDocument[]> {
        const tasks = 
            await this._model.find().skip(page * taskPerPage).limit(taskPerPage).exec();   
        return tasks;
    }
}


