import { ITask, ITaskDocument } from '../models/TaskModel';
<<<<<<< HEAD
import { ITaskRepository, TasksRepository } from '../repositories/TasksRepo';
=======
import { IRepository } from '../repositories/BaseRepo';
import { TasksRepository } from '../repositories/TasksRepo';
>>>>>>> 22f550d (Refactor tasks pagination and update tasks service)
import { Inject, Service } from 'typedi';

export interface ITasksService {
<<<<<<< HEAD
<<<<<<< HEAD
    createTask: (taskData: ITask) => Promise<ITaskDocument>;
    getTaskList: (taskPage: number, taskPerPage: number) => Promise<ITaskDocument[]>;
=======
<<<<<<< HEAD
    createTask: (taskData: ITaskDocument) => Promise<ITaskDocument>;
>>>>>>> b405931 (add getTask Method 🐥)
    getTaskById: (id: string) => Promise<ITaskDocument | null>;
    updateTask: (
        id: string,
        updateData: Partial<ITask>,
    ) => Promise<ITaskDocument | null>;
=======
    getTasks(taskPage: any, taskPerPage: any): unknown;
=======
>>>>>>> 22f550d (Refactor tasks pagination and update tasks service)
    createTask: (taskData: ITask) => Promise<ITaskDocument>;
    getTasks: (taskPage: number, taskPerPage: number) => Promise<ITaskDocument>;
}

@Service()
<<<<<<< HEAD
export class TasksService implements ITasksService {
    private taskRepository: ITaskRepository;

    constructor(
        @Inject(() => TasksRepository)
        taskRepository: ITaskRepository,
=======
class TaskService implements ITasksService {
    private tasksRepository: IRepository<ITask>;

    constructor(
        @Inject(() => TasksRepository)
        taskRepository: IRepository<ITask>,
>>>>>>> 22f550d (Refactor tasks pagination and update tasks service)
    ) {
        this.tasksRepository = taskRepository;
    }

    async createTask(taskData: ITask): Promise<ITaskDocument> {
        try {
            const task: ITaskDocument =
                await this.tasksRepository.create(taskData);
            return task;
        } catch (error) {
<<<<<<< HEAD
            if (error instanceof ValidationError) throw error;
            else {
                throw new Error('Unknown Error');
            }
        }
    }

    async getTaskList(page: number, taskPerPage: number): Promise<ITaskDocument[]> {
        try {
            const tasks: ITaskDocument[] = await this.taskRepository.findTaskByPage(page, taskPerPage);
            return tasks;
        } catch (error) {
            throw error;
        }
    }

    async getTaskById(id: string): Promise<ITaskDocument | null> {
        try {
            const task = await this.taskRepository.findOne(id);
            return task;
        } catch (error) {
            return null;
=======
            throw error;
>>>>>>> 22f550d (Refactor tasks pagination and update tasks service)
        }
    }

    async getTasks(page: number, taskPerPage: number): Promise<ITaskDocument> {
        try {
            const tasks: ITaskDocument = 
            await this.tasksRepository.findTaskByPage(page, taskPerPage);
            return tasks;
        } catch (error) {
            throw error;
        }
    }
}

export default TaskService;
