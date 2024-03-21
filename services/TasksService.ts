import { ITask, ITaskDocument } from '../models/TaskModel';
import { ITasksRepository, TasksRepository } from '../repositories/TasksRepo';
import { IUsersRepositorty, UsersRepository } from '../repositories/UsersRepo';
import {
    CannotApplyTaskError,
    CannotCancelTaskError,
} from '../errors/TaskError';
import { Inject, Service } from 'typedi';
import { ValidationError } from '../errors/RepoError';
import { ImageService } from '../services/ImageService';

import categoryData from '../assets/categories/categorieslist.json';
import mongoose, { FilterQuery, Types } from 'mongoose';

import dotenv from 'dotenv';
dotenv.config({ path: './config/config.env' });

const IMAGE_EXPIRE_TIME_SECONDS = Number(process.env.IMAGE_EXPIRE_TIME); // Assuming IMAGE_EXPIRE_TIME is defined in your environment variables

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
}

@Service()
export class TasksService implements ITasksService {
    private taskRepository: ITasksRepository;
    private userRepository: IUsersRepositorty;
    private imageService: ImageService;

    constructor(
        @Inject(() => TasksRepository)
        taskRepository: ITasksRepository,
        @Inject(() => UsersRepository)
        userRepository: IUsersRepositorty,
        @Inject(() => ImageService)
        imageService: ImageService,
    ) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.imageService = imageService;
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
            const result = await this.taskRepository.findTasksByPage(
                page,
                taskPerPage,
                filter,
            );

            // Update image URLs for each task
            const tasksWithUpdatedUrls = await Promise.all(
                result.tasks.map(async task => {
                    return await this.updateTaskImageUrl(task);
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
            if (task) {
                // Update image URL for the task
                return await this.updateTaskImageUrl(task);
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
            const task = await this.taskRepository.findOneWithGeneralInfo(id);
            if (task) {
                // Update image URL for the task
                return await this.updateTaskImageUrl(task);
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
            const tasks = await this.taskRepository.findTaskByWorkerIdAndStatus(
                userId,
                status,
            );
            // Update image URLs for each task
            const tasksWithUpdatedUrls = await Promise.all(
                tasks.map(async task => {
                    return await this.updateTaskImageUrl(task);
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
            const tasks = await this.taskRepository.findTasks(filter);
            // Update image URLs for each task
            const tasksWithUpdatedUrls = await Promise.all(
                tasks.map(async task => {
                    return await this.updateTaskImageUrl(task);
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

    async updateTaskImageUrl(task: ITaskDocument): Promise<ITaskDocument> {
        let imageUrl: string | undefined = task.imageUrl;
        const imageUrlLastUpdateTime = task.imageUrlLastUpdateTime;

        // Logic to update image URLs if needed
        if (
            !imageUrlLastUpdateTime ||
            Date.now() >
                imageUrlLastUpdateTime.getTime() +
                    IMAGE_EXPIRE_TIME_SECONDS * 1000
        ) {
            const imageKey = task.imageKey;
            if (imageKey) {
                const fetchedImageUrl =
                    await this.imageService.getImageByKey(imageKey);
                if (fetchedImageUrl) {
                    imageUrl = fetchedImageUrl;
                    // Update imageUrl and imageUrlLastUpdateTime
                    task.imageUrl = fetchedImageUrl;
                    task.imageUrlLastUpdateTime = new Date();
                    // Update the task in the database if necessary
                    await this.taskRepository.update(task._id, {
                        imageUrl: fetchedImageUrl,
                        imageUrlLastUpdateTime: new Date(),
                    } as ITaskDocument);
                    console.log('Updated imageUrl successfully');
                }
            }
        }

        return task;
    }

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
}
