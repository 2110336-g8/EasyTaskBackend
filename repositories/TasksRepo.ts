import { IOtpDocument } from '../models/OtpModel';
import { ITask, ITaskDocument, TaskModel } from '../models/TaskModel';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { Service } from 'typedi';

export interface ITaskRepository extends IRepository<ITask> {}

@Service()
export class TasksRepository
    extends BaseMongooseRepository<ITask>
    implements ITaskRepository
{
    constructor() {
        super(TaskModel);
    }

    async findTaskByPage(page: number, taskPerPage: number): Promise<ITaskDocument[]> {
        const tasks = await this._model.find().skip(page * taskPerPage).limit(taskPerPage);
        return tasks;
    }
}


