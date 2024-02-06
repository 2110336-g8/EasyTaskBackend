import { ITask, ITaskDocument } from '../models/TaskModel';
import { IRepository } from '../repositories/BaseRepo';
import { TasksRepository } from '../repositories/TasksRepo';
import { Inject, Service } from 'typedi';

export interface ITasksService {
    getTasks(taskPage: any, taskPerPage: any): unknown;
    createTask: (taskData: ITask) => Promise<ITaskDocument>;
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

    async getTasks(page: number, taskPerPage: number): Promise<ITaskDocument> {
        try {
            const tasks: ITaskDocument = await this.tasksRepository.findTaskByPage(page, taskPerPage);
            return tasks;
        } catch (error) {
            throw error;
        }
    }
}

export default TaskService;
