import { ITask, ITaskDocument } from '../models/TaskModel';
import { ITasksRepository, TasksRepository } from '../repositories/TasksRepo';
import { Inject, Service } from 'typedi';
import { ValidationError } from '../errors/RepoError';
import { FilterQuery } from 'mongoose';
export interface ITasksService {
    createTask: (taskData: ITask) => Promise<ITaskDocument>;
    getTaskList: (
        taskPage: number,
        taskPerPage: number,
        filter?: FilterQuery<ITaskDocument>,
    ) => Promise<{ tasks: ITaskDocument[]; count: number }>;
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

    createTask = async (taskData: ITask): Promise<ITaskDocument> => {
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
    };

    async getTaskList(
        page: number,
        taskPerPage: number,
        filter: FilterQuery<ITaskDocument> = {},
    ): Promise<{ tasks: ITaskDocument[]; count: number }> {
        try {
            const result = await this.taskRepository.findTasksByPage(
                page,
                taskPerPage,
                filter,
            );
            return result;
        } catch (error) {
            console.error(error);
            return { tasks: [], count: 0 };
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

    getTaskById = async (id: string): Promise<ITaskDocument | null> => {
        try {
            const task = await this.taskRepository.findOne(id);
            return task;
        } catch (error) {
            return null;
        }
    };

    updateTask = async (
        id: string,
        updateData: ITask,
    ): Promise<ITaskDocument | null> => {
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
    };
}
