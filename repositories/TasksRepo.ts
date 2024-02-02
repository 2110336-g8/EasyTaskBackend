import { IOtpDocument } from '../models/OtpModel';
import { ITaskDocument, TaskModel } from '../models/TaskModel';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { Service } from 'typedi';

export interface ITaskRepository extends IRepository<ITaskDocument> {}

@Service()
export class TasksRepository
    extends BaseMongooseRepository<ITaskDocument>
    implements ITaskRepository
{
    constructor() {
        super(TaskModel);
    }
}
