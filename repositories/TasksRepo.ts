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
}
