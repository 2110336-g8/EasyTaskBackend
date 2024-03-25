import { ITask, ITaskDocument } from '../models/TaskModel';
import { ITasksRepository, TasksRepository } from '../repositories/TasksRepo';
import { IUsersRepository, UsersRepository } from '../repositories/UsersRepo';
import { ICandidate } from '../models/CandidateModel';
import {
    CannotApplyTaskError,
    CannotCancelTaskError,
} from '../errors/TaskError';
import { Inject, Service } from 'typedi';
import { ValidationError } from '../errors/RepoError';
import {
    ImagesRepository,
    IImagesRepository,
} from '../repositories/ImagesRepository';

import categoryData from '../assets/categories/categorieslist.json';
import mongoose, { FilterQuery, Types } from 'mongoose';

export interface ITasksService {
    createTask: (taskData: ITask) => Promise<ITaskDocument>;
    getTaskList: (
        taskPage: number,
        taskPerPage: number,
        filter?: FilterQuery<ITaskDocument>,
    ) => Promise<{ tasks: ITaskDocument[]; count: number }>;
    countTasks: () => Promise<number | null>;
    getTaskExperience: (
        userId: string,
        status: string | undefined,
    ) => Promise<ITaskDocument[]>;
    getTaskById: (id: string) => Promise<ITaskDocument | null>;
    getTaskWithGeneralInfoById: (id: string) => Promise<ITaskDocument | null>;
    updateTask: (
        id: string,
        updateData: ITask,
    ) => Promise<ITaskDocument | null>;
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
    getTaskImage: (id: string) => Promise<string | null>;
    updateTaskImage: (
        userId: string,
        fileBuffer: Buffer,
        mimetype: string,
        key: string,
    ) => Promise<void>;

    deleteTaskImage: (taskId: string, imageKey: string) => Promise<void>;
}

@Service()
export class TasksService implements ITasksService {
    private tasksRepository: ITasksRepository;
    private usersRepository: IUsersRepository;
    private imagesRepository: IImagesRepository;

    constructor(
        @Inject(() => TasksRepository)
        tasksRepository: ITasksRepository,
        @Inject(() => UsersRepository)
        usersRepository: IUsersRepository,
        @Inject(() => ImagesRepository)
        imagesRepository: IImagesRepository,
    ) {
        this.tasksRepository = tasksRepository;
        this.usersRepository = usersRepository;
        this.imagesRepository = imagesRepository;
    }

    createTask = async (taskData: ITask): Promise<ITaskDocument> => {
        const session = await this.tasksRepository.startSession();
        session.startTransaction();
        try {
            const task: ITaskDocument =
                await this.tasksRepository.create(taskData);
            const updatedUser = await this.usersRepository.addOwnedTasks(
                task._id.toString(),
                task.customerId.toString(),
            );
            if (!updatedUser) {
                throw new ValidationError(
                    'Failed to update user with owned tasks.',
                );
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
            const result = await this.tasksRepository.findTasksByPage(
                page,
                taskPerPage,
                filter,
            );

            // Update image URLs for each task
            const tasksWithUpdatedUrls = await Promise.all(
                result.tasks.map(async task => {
                    return await this.imagesRepository.updateTaskImageUrl(task);
                }),
            );

            return { tasks: tasksWithUpdatedUrls, count: result.count };
        } catch (error) {
            console.error(error);
            return { tasks: [], count: 0 };
        }
    }

    async countTasks(): Promise<number | null> {
        try {
            const count = await this.tasksRepository.countAllTasks();
            return count;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    async getTaskById(id: string): Promise<ITaskDocument | null> {
        try {
            const task = await this.tasksRepository.findOne(id);
            if (task) {
                // Update image URL for the task
                return await this.imagesRepository.updateTaskImageUrl(task);
            }
            return null;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    getTaskWithGeneralInfoById = async (
        id: string,
    ): Promise<ITaskDocument | null> => {
        try {
            const task = await this.tasksRepository.findOneWithGeneralInfo(id);
            if (task) {
                // Update image URL for the task
                return await this.imagesRepository.updateTaskImageUrl(task);
            }
            return null;
        } catch (error) {
            return null;
        }
    };

    //taskOf
    getTaskExperience = async (
        userId: string,
        status: string | undefined,
    ): Promise<ITaskDocument[]> => {
        try {
            const tasks =
                await this.tasksRepository.findTaskByWorkerIdAndStatus(
                    userId,
                    status,
                );
            // Update image URLs for each task
            const tasksWithUpdatedUrls = await Promise.all(
                tasks.map(async task => {
                    return await this.imagesRepository.updateTaskImageUrl(task);
                }),
            );

            return tasksWithUpdatedUrls;
        } catch (error) {
            throw error;
        }
    };

    //adsOf
    getAdvertisement = async (
        customerId: string,
        status: string,
    ): Promise<ITaskDocument[]> => {
        let filter: FilterQuery<ITaskDocument> = {
            customerId: customerId,
        };

        // Check if status is provided and not an empty string
        if (status && status.trim() !== '') {
            filter = {
                ...filter,
                status: status as
                    | 'Open'
                    | 'In Progress'
                    | 'Completed'
                    | 'Closed',
            };
        }

        try {
            const tasks = await this.tasksRepository.findTasks(filter);
            // Update image URLs for each task
            const tasksWithUpdatedUrls = await Promise.all(
                tasks.map(async task => {
                    return await this.imagesRepository.updateTaskImageUrl(task);
                }),
            );

            return tasksWithUpdatedUrls;
        } catch (error) {
            console.error(error);
            return [];
        }
    };

    updateTask = async (
        id: string,
        updateData: ITask,
    ): Promise<ITaskDocument | null> => {
        try {
            if (updateData) {
                const updatedTask = await this.tasksRepository.update(
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
        const session = await this.tasksRepository.startSession();
        session.startTransaction();
        try {
            const updatedUser = await this.usersRepository.addApplications(
                taskId,
                userId,
                timestamps,
            );
            if (!updatedUser) {
                throw new CannotApplyTaskError(
                    'You have already applied to this task or your application has been accepted.',
                );
            }

            const updatedTask = await this.tasksRepository.addApplicants(
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
        const session = await this.tasksRepository.startSession();
        session.startTransaction();
        try {
            await this.usersRepository.rejectAllApplicationsForOneTask(taskId);

            const updatedTask = await this.tasksRepository.closeTask(taskId);
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

    //image --------------------------------------------------------------------
    async getTaskImage(id: string): Promise<string | null> {
        const task = await this.getTaskById(id);
        if (!task) return null;

        const updatedTask =
            await this.imagesRepository.updateTaskImageUrl(task);
        if (!updatedTask.imageUrl) return null;
        return updatedTask.imageUrl;
    }

    async updateTaskImage(
        userId: string,
        fileBuffer: Buffer,
        mimetype: string,
        key: string,
    ): Promise<void> {
        try {
            // Update the user's imageKey
            await this.updateTask(userId, {
                imageKey: key,
            } as ITaskDocument);

            // Upload the file to AWS S3
            await this.imagesRepository.createImage(fileBuffer, mimetype, key);
        } catch (error) {
            throw new Error('Failed to update task image');
        }
    }

    async deleteTaskImage(taskId: string, imageKey: string): Promise<void> {
        try {
            // Delete the image from the repository
            const success = await this.imagesRepository.deleteImage(imageKey);
            if (success) {
                await this.updateTask(taskId, {
                    imageKey: null,
                    imageUrl: null,
                    imageUrlLastUpdateTime: null,
                } as ITaskDocument);
            }
        } catch (error) {
            throw new Error('Failed to delete task image');
        }
    }
}
