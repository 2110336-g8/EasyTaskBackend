import { ITask, ITaskDocument } from '../models/TaskModel';
import { IRepository } from '../repositories/BaseRepo';
import { TasksRepository } from '../repositories/TasksRepo';
import { Inject, Service } from 'typedi';

export interface ITasksService {
    createTask: (taskData: ITask) => Promise<ITaskDocument>;
    getTaskById: (id: string) => Promise<ITaskDocument | null>;
}

@Service()
class TaskService implements ITasksService {
    private tasksRepository: IRepository<ITask>;

    constructor(
        @Inject(() => TasksRepository)
        taskRepository: IRepository<ITask>,
    ) {
        this.tasksRepository = taskRepository;
    }
    async createTask(taskData: ITask): Promise<ITaskDocument> {
        try {
            const task: ITaskDocument =
                await this.tasksRepository.create(taskData);
            return task;
        } catch (error) {
            throw error;
        }
    }
    async getTaskById(id: string): Promise<ITaskDocument | null> {
        try {
            const task = await this.tasksRepository.findOne(id);
            return task;
        } catch (error) {
            return null;
        }
    }
}

export default TaskService;
