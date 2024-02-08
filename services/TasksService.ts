import { ITask, ITaskDocument } from '../models/TaskModel';
import { IRepository } from '../repositories/BaseRepo';
import { ITaskRepository, TasksRepository } from '../repositories/TasksRepo';
import { Inject, Service } from 'typedi';

export interface ITasksService {
    getTaskList(taskPage: any, taskPerPage: any): unknown;
    createTask: (taskData: ITask) => Promise<ITaskDocument>;
}

@Service()
class TaskService implements ITasksService {
    private tasksRepository: ITaskRepository;

    constructor(
        @Inject(() => TasksRepository)
        taskRepository: ITaskRepository,
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

    async getTaskList(page: number, taskPerPage: number): Promise<ITaskDocument[]> {
        try {
            const tasks: ITaskDocument[] = await this.tasksRepository.findTaskByPage(page, taskPerPage);
            return tasks;
        } catch (error) {
            throw error;
        }
    }
}

export default TaskService;
