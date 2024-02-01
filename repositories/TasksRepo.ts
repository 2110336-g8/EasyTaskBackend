import { ITaskDocument, TaskModel } from '../models/TaskModel';
import { BaseMongooseRepository } from './BaseRepo';
import { Service } from 'typedi';

@Service()
export class TasksRepository extends BaseMongooseRepository<ITaskDocument> {
    constructor() {
        super(TaskModel);
    }
}
