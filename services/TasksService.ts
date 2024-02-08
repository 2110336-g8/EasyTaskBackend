import { ITask, ITaskDocument } from '../models/TaskModel';
import { ITasksRepository, TasksRepository } from '../repositories/TasksRepo';
import { Inject, Service } from 'typedi';
import { ValidationError } from '../errors/RepoError';

export interface ITasksService {
    createTask: (taskData: ITaskDocument) => Promise<ITaskDocument>;
}

@Service()
export class TasksService implements ITasksService {
    private taskRepository: ITasksRepository;

    constructor(
        @Inject(() => TasksRepository)
        taskRepository: ITasksRepository,
    ) {
        this.taskRepository = taskRepository;
    }
    async createTask(taskData: ITask): Promise<ITaskDocument> {
        try {
            const task: ITaskDocument =
                await this.taskRepository.create(taskData);
            return task;
        } catch (error) {
            if (error instanceof ValidationError) throw error;
            else {
                throw new Error('Unknown Error');
            }
        }
    }
}
