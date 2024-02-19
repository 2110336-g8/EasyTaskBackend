import { ITask, ITaskDocument } from '../models/TaskModel';
import { ITasksRepository, TasksRepository } from '../repositories/TasksRepo';
import { Inject, Service } from 'typedi';
import { ValidationError } from '../errors/RepoError';

export interface ITasksService {
    createTask: (taskData: ITask) => Promise<ITaskDocument>;
    getTaskList: (
        taskPage: number,
        taskPerPage: number,
    ) => Promise<ITaskDocument[]>;
    getTaskById: (id: string) => Promise<ITaskDocument | null>;
    updateTask: (
        id: string,
        updateData: ITask,
    ) => Promise<ITaskDocument | null>;
    countTasks: () => Promise<number | null>;
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

    async getTaskList(
        page: number,
        taskPerPage: number,
    ): Promise<ITaskDocument[]> {
        try {
            const taskList: ITaskDocument[] =
                await this.taskRepository.findTasksByPage(page, taskPerPage);
            return taskList;
        } catch (error) {
            return [];
        }
    }

    async countTasks(): Promise<number | null> {
        try {
            const count = await this.taskRepository.countAllTasks();
            return count;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    async getTaskById(id: string): Promise<ITaskDocument | null> {
        try {
            const task = await this.taskRepository.findOne(id);
            return task;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    async updateTask(
        id: string,
        updateData: ITask,
    ): Promise<ITaskDocument | null> {
        try {
            if (updateData) {
                const updatedTask = await this.taskRepository.update(
                    id,
                    updateData,
                );
                return updatedTask;
            } else {
                return null;
            }
        } catch (error) {
            console.error(error);
            return null;
        }
    }
}
