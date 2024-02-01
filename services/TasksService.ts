import { ITaskDocument } from '../models/TaskModel';
import { IRepository } from '../repositories/BaseRepo';
import { TasksRepository } from '../repositories/TasksRepo';
import { Inject, Service } from 'typedi';

export interface ITasksService {
    createTask: (taskData: ITaskDocument) => Promise<ITaskDocument>;
}

@Service()
class TaskService implements ITasksService {
    private tasksRepository: IRepository<ITaskDocument>;

    constructor(
        @Inject(() => TasksRepository)
        taskRepository: IRepository<ITaskDocument>,
    ) {
        this.tasksRepository = taskRepository;
    }
    async createTask(taskData: ITaskDocument): Promise<ITaskDocument> {
        try {
            const task: ITaskDocument =
                await this.tasksRepository.create(taskData);
            return task;
        } catch (error) {
            throw error;
        }
    }
}

export default TaskService;
