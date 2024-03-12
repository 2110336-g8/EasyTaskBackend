import { ITask, ITaskDocument } from '../models/TaskModel';
import { ITasksRepository, TasksRepository } from '../repositories/TasksRepo';
import { IUsersRepositorty, UsersRepository } from '../repositories/UsersRepo';
import {
    CannotApplyTaskError,
    CannotCancelTaskError,
} from '../errors/TaskError';
import { Inject, Service } from 'typedi';
import { ValidationError } from '../errors/RepoError';
import categoryData from '../assets/categories/categorieslist.json';
import mongoose, { FilterQuery, Document, Types, Schema } from 'mongoose';
export interface ITasksService {
    createTask: (taskData: ITask) => Promise<ITaskDocument>;
    getTaskList: (
        taskPage: number,
        taskPerPage: number,
        filter?: FilterQuery<ITaskDocument>,
    ) => Promise<{ tasks: ITaskDocument[]; count: number }>;
    getTaskById: (id: string) => Promise<ITaskDocument | null>;
    getTaskWithGeneralInfoById: (id: string) => Promise<ITaskDocument | null>;
    updateTask: (
        id: string,
        updateData: ITask,
    ) => Promise<ITaskDocument | null>;
    countTasks: () => Promise<number | null>;
    getCategories: () => Promise<String[]>;
    applyTask: (
        taskId: string,
        userId: string,
    ) => Promise<ITaskDocument | null>;
    cancelTask: (taskId: string) => Promise<ITaskDocument | null>;
    getAdvertisement: (
        customerId: string,
        status: string,
    ) => Promise<ITaskDocument[] | null>;
}

@Service()
export class TasksService implements ITasksService {
    private taskRepository: ITasksRepository;
    private userRepository: IUsersRepositorty;

    constructor(
        @Inject(() => TasksRepository)
        taskRepository: ITasksRepository,
        @Inject(() => UsersRepository)
        userRepository: IUsersRepositorty,
    ) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    createTask = async (taskData: ITask): Promise<ITaskDocument> => {
        const session = await this.taskRepository.startSession();
        session.startTransaction();
        try {
            const task: ITaskDocument =
                await this.taskRepository.create(taskData);
            const updatedUser = await this.userRepository.addOwnedTasks(
                task._id.toString(),
                task.customerId.toString(),
            );
            if (!updatedUser) {
                throw new Error('Failed to update user with owned tasks.');
            }
            await session.commitTransaction();
            session.endSession();
            return task;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            if (error instanceof ValidationError) throw error;
            else {
                throw error;
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

    getTaskWithGeneralInfoById = async (
        id: string,
    ): Promise<ITaskDocument | null> => {
        try {
            const task = await this.taskRepository.findOneWithGeneralInfo(id);
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

    getCategories = async (): Promise<String[]> => {
        try {
            const categories: String[] = categoryData.categories;
            return categories;
        } catch (error) {
            return [];
        }
    };

    applyTask = async (
        taskId: string,
        userId: string,
    ): Promise<ITaskDocument | null> => {
        const timestamps = new Date();
        const session = await this.taskRepository.startSession();
        session.startTransaction();
        try {
            const updatedUser = await this.userRepository.addApplications(
                taskId,
                userId,
                timestamps,
            );
            if (!updatedUser) {
                throw new CannotApplyTaskError(
                    'You have already applied to this task or your application has been accepted.',
                );
            }

            const updatedTask = await this.taskRepository.addApplicants(
                taskId,
                userId,
                timestamps,
            );
            if (!updatedTask) {
                throw new CannotApplyTaskError(
                    'You have already applied to this task or your application has been accepted.',
                );
            }
            const generalInfoTask = {
                ...updatedTask.toObject(),
                applicants: undefined,
                hiredWorkers: undefined,
            };

            await session.commitTransaction();
            session.endSession();
            return generalInfoTask as ITaskDocument;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    };

    cancelTask = async (taskId: string): Promise<ITaskDocument | null> => {
        const session = await this.taskRepository.startSession();
        session.startTransaction();
        try {
            await this.userRepository.rejectAllApplicationsForOneTask(taskId);

            const updatedTask = await this.taskRepository.closeTask(taskId);
            if (!updatedTask) {
                throw new CannotCancelTaskError('Failed to cancel task');
            }
            await session.commitTransaction();
            session.endSession();
            return updatedTask;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    };

    getAdvertisement = async (
        customerId: string,
        status: string,
    ): Promise<ITaskDocument[]> => {
        const filter: Record<string, unknown> = {
            customerId: customerId,
            status: status as 'Open' | 'In Progress' | 'Completed' | 'Closed',
        };

        try {
            const tasks = await this.taskRepository.findTasks(filter);
            return tasks;
        } catch (error) {
            console.error(error);
            return [];
        }
    };
}
