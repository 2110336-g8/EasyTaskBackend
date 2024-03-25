import { ITask, ITaskDocument } from '../models/TaskModel';
import { ITasksRepository, TasksRepository } from '../repositories/TasksRepo';
import { IUsersRepositorty, UsersRepository } from '../repositories/UsersRepo';
import { ICandidate } from '../models/CandidateModel';
import {
    CannotApplyTaskError,
    CannotSelectCandidateError,
    CannotDismissTaskError,
    CannotUpdateApplicationStatusError,
    InvalidUpdateApplicationStatusError,
    CannotStartTaskError,
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
    getTaskById: (id: string) => Promise<ITaskDocument | null>;
    getTaskWithGeneralInfoById: (id: string) => Promise<ITaskDocument | null>;
    updateTask: (
        id: string,
        updateData: ITask,
    ) => Promise<ITaskDocument | null>;

    getTaskExperience: (
        userId: string,
        status: string | undefined,
    ) => Promise<ITaskDocument[]>;
    getAdvertisement: (
        customerId: string,
        status: string,
    ) => Promise<ITaskDocument[] | null>;

    getCategories: () => Promise<String[]>;
    applyTask: (
        taskId: string,
        userId: string,
    ) => Promise<ITaskDocument | null>;
    getCandidate: (id: string) => Promise<ICandidate | null>;
    selectCandidate: (
        taskId: string,
        selectCandidates: string[],
    ) => Promise<ICandidate>;
    responseOffer: (
        taskId: string,
        userId: string,
        response: boolean,
    ) => Promise<null>;
    startTask: (taskId: string) => Promise<ITaskDocument | null>;
    dismissOpenTask: (taskId: string) => Promise<ITaskDocument | null>;
    dismissInProgressTask: (taskId: string) => Promise<ITaskDocument | null>;
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
                console.error(
                    'Update ownedTask failed: Document not found or constraint violated',
                );
                throw new ValidationError(
                    'Failed to update advertisement of user.',
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
                    return await this.updateTaskImageUrls(task);
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
                return await this.updateTaskImageUrls(task);
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
                return await this.updateTaskImageUrls(task);
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
                    return await this.updateTaskImageUrls(task);
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
                    return await this.updateTaskImageUrls(task);
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

    async updateTaskImageUrls(task: ITaskDocument): Promise<ITaskDocument> {
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
            // Check if there is an existing application with the same taskId
            const existingApplication = await this.userRepository.findUser({
                _id: userId,
                'applications.taskId': taskId,
            });

            // If an application with the same taskId exists
            if (existingApplication) {
                console.error(
                    'Update user application failed: An application with the same taskId already exists.',
                );
                throw new CannotApplyTaskError(
                    'You have already applied to this task.',
                );
            }

            // If no existing application with the same taskId, proceed with the update
            const updatedUser = await this.userRepository.addApplication(
                taskId,
                userId,
                timestamps,
            );
            if (!updatedUser) {
                console.error(
                    'Update user application failed - Document not found or constraint violated.',
                );
                throw new CannotApplyTaskError(
                    'Validation error - document not found or constraint violated.',
                );
            }

            // Check if there is an existing applicant with the same userId
            const existingApplicant = await this.taskRepository.findTask({
                _id: taskId,
                'applicants.userId': userId,
            });

            // If an applicant with the same userId exists
            if (existingApplicant) {
                console.error(
                    'Update task applicant failed - An applicant with the same userId already exists.',
                );
                throw new CannotApplyTaskError(
                    'You have already applied to this task',
                );
            }

            // If no existing applicant with the same userId, proceed with the update
            const updatedTask = await this.taskRepository.addApplicant(
                taskId,
                userId,
                timestamps,
            );

            if (!updatedTask) {
                console.error(
                    'Update task applicant failed - Document not found or constraint violated.',
                );
                throw new CannotApplyTaskError(
                    'Validation error - document not found or constraint violated.',
                );
            }

            // format return task
            const generalInfoTask = {
                ...updatedTask.toObject(),
                imageKey: undefined,
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

    getCandidate = async (taskId: string): Promise<ICandidate | null> => {
        try {
            const task = await this.taskRepository.findOne(taskId);
            if (!task) {
                return null;
            }
            const result: ICandidate = {
                taskId: taskId,
                capacity: task.workers,
                vacancy: task.workers,
                candidates: { pending: [], offering: [], accepted: [] },
            }; // Initialize result object
            if (task.applicants.length == 0) {
                return result;
            }
            for (const candidate of task.applicants) {
                if (
                    !['Pending', 'Offering', 'Accepted'].includes(
                        candidate.status,
                    )
                ) {
                    continue;
                }
                const user = await this.userRepository.findOne(
                    candidate.userId.toString(),
                );
                if (user) {
                    const tmp = {
                        userId: user.id.toString(),
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        phoneNumber: user.phoneNumber,
                        description: user.description,
                        imageUrl: user.imageUrl,
                        appliedAt: candidate.createdAt,
                    };

                    if (candidate.status === 'Pending') {
                        result.candidates.pending.push(tmp); // Push to pending array if status is Pending
                    } else if (candidate.status === 'Offering') {
                        result.candidates.offering.push(tmp); // Push to pending array if status is Offering
                    } else if (candidate.status === 'Accepted') {
                        result.candidates.accepted.push(tmp); // Push to accepted array if status is Accepted
                    }
                }
            }
            result.vacancy =
                result.capacity - result.candidates.accepted.length;
            return result;
        } catch (error) {
            console.error('Error occurred while fetching candidates:', error);
            throw error;
        }
    };

    selectCandidate = async (
        taskId: string,
        selectedCandidates: string[],
    ): Promise<ICandidate> => {
        // Check validation of selectedCandidateds
        const task = await this.taskRepository.findOne(taskId);
        if (!task) {
            throw new CannotSelectCandidateError('Invalid task');
        }
        if (selectedCandidates.length === 0) {
            throw new CannotSelectCandidateError('No candidates selected');
        }
        const candidateIds = task.applicants
            .filter(applicant => applicant.status === 'Pending')
            .map(applicant => applicant.userId.toString());
        for (const id of selectedCandidates) {
            if (!candidateIds.includes(id)) {
                throw new CannotSelectCandidateError(
                    'Some candidates are invalid',
                );
            }
        }
        // update status
        const session = await this.taskRepository.startSession();
        session.startTransaction();
        try {
            const updatedApplicant =
                await this.taskRepository.updateApplicantStatus(
                    taskId,
                    selectedCandidates,
                    ['Pending'],
                    'Offering',
                );
            await this.checkUpdatedApplication(
                updatedApplicant.acknowledged,
                updatedApplicant.matchedCount,
                updatedApplicant.modifiedCount,
            );

            const updatedApplication =
                await this.userRepository.updateApplicationStatus(
                    taskId,
                    selectedCandidates,
                    ['Pending'],
                    'Offering',
                );
            await this.checkUpdatedApplication(
                updatedApplication.acknowledged,
                updatedApplication.matchedCount,
                updatedApplication.modifiedCount,
            );

            const candidate = await this.getCandidate(taskId);
            if (!candidate) {
                console.error(
                    'Cannot get candidate information after selection, dismiss selection',
                );
                throw new CannotSelectCandidateError(`Task not found`);
            }
            await session.commitTransaction();
            session.endSession();
            return candidate;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('Error occurred while selecting candidates:', error);
            throw error;
        }
    };

    // Check result of calling this.taskRepository.updateApplicantStatus
    // Check result of calling this.userRepository.updateApplicationStatus
    checkUpdatedApplication = async (
        acknowledged: boolean,
        matchedCount: number,
        modifiedCount: number,
    ): Promise<null> => {
        if (!acknowledged) {
            throw new CannotUpdateApplicationStatusError(
                'Update operation failed: Unexpected result.',
            );
        }
        if (matchedCount === 0) {
            throw new InvalidUpdateApplicationStatusError(
                'Update operation failed: Document(s) not matched.',
            );
        }
        if (matchedCount != modifiedCount) {
            throw new CannotUpdateApplicationStatusError(
                'Update operation failed: Matched count does not match modified count.',
            );
        }
        return null;
    };

    responseOffer = async (
        taskId: string,
        userId: string,
        response: boolean,
    ): Promise<null> => {
        // if response = true, set status to 'Accepted', else set to 'Rejected'
        const status = response ? 'Accepted' : 'Rejected';
        const session = await this.taskRepository.startSession();
        session.startTransaction();
        try {
            const updatedApplicant =
                await this.taskRepository.updateApplicantStatus(
                    taskId,
                    [userId],
                    ['Offering'],
                    status,
                );
            await this.checkUpdatedApplication(
                updatedApplicant.acknowledged,
                updatedApplicant.matchedCount,
                updatedApplicant.modifiedCount,
            );
            const updatedApplication =
                await this.userRepository.updateApplicationStatus(
                    taskId,
                    [userId],
                    ['Offering'],
                    status,
                );
            await this.checkUpdatedApplication(
                updatedApplication.acknowledged,
                updatedApplication.matchedCount,
                updatedApplication.modifiedCount,
            );
            await session.commitTransaction();
            session.endSession();
            return null;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    };

    startTask = async (taskId: string): Promise<ITaskDocument | null> => {
        const timestamps = new Date();
        const session = await this.taskRepository.startSession();
        session.startTransaction();
        try {
            const task = await this.taskRepository.findOne(taskId);
            if (!task) {
                throw new CannotStartTaskError('Invalid task id');
            }
            // Step 0 : check whether task is open so that task can begin
            if (task.status != 'Open') {
                throw new CannotStartTaskError(
                    'The task is not in a state that can be started.',
                );
            }
            // Step 1: check whether the task can be started or not
            // Count the number of applicants with status 'Accepted'
            const acceptedApplicants = task.applicants
                .filter(applicant => applicant.status === 'Accepted')
                .map(applicant => applicant.userId.toString());
            if (acceptedApplicants.length === 0) {
                throw new CannotStartTaskError('This task has no employee');
            }
            // Step 2 : adding data in user and task model
            for (const applicant of acceptedApplicants) {
                // Step 2-1 : add task in user data
                // Check if there is an existing task with the same taskId
                const existingTask = await this.userRepository.findUser({
                    _id: applicant,
                    'tasks.taskId': taskId,
                });

                // If an application with the same taskId exists
                if (existingTask) {
                    console.error(
                        'Update user task failed: A task with the same taskId already exists.',
                    );
                    throw new CannotStartTaskError(
                        'The task has already started, and there are employees who are currently working on it or have completed their work.',
                    );
                }
                // If no existing task with the same taskId, proceed with the update
                const updatedUser = await this.userRepository.addTask(
                    taskId,
                    applicant,
                    timestamps,
                );
                if (!updatedUser) {
                    console.error(
                        'Update user task failed - Document not found or constraint violated.',
                    );
                    throw new CannotStartTaskError(
                        'Validation error - document not found or constraint violated.',
                    );
                }

                // Step 2-2 : add hired worker in task data
                // Check if there is an existing hired worker with the same userId
                const existingHiredWorker = await this.taskRepository.findTask({
                    _id: taskId,
                    'hiredWorkers.userId': applicant,
                });

                // If an hired worker with the same userId exists
                if (existingHiredWorker) {
                    console.error(
                        'Update hired worker failed: An user with the same userId already exists.',
                    );
                    throw new CannotStartTaskError(
                        'The task has already started, and there are employees who are currently working on it or have completed their work.',
                    );
                }
                // If no existing hired worker with the same userId, proceed with the update
                const updatedTask = await this.taskRepository.addHiredWorker(
                    taskId,
                    applicant,
                    timestamps,
                );
                if (!updatedTask) {
                    console.error(
                        'Update task hired worker failed - Document not found or constraint violated.',
                    );
                    throw new CannotStartTaskError(
                        'Validation error - document not found or constraint violated.',
                    );
                }
            }

            // Step 3 : update application status in user model from 'Pending' or 'Offering' to 'NotProceed'
            const updatedApplication =
                await this.userRepository.updateApplicationStatus(
                    taskId,
                    undefined,
                    ['Pending', 'Offering'],
                    'NotProceed',
                );
            await this.checkUpdatedApplication(
                updatedApplication.acknowledged,
                updatedApplication.matchedCount,
                updatedApplication.modifiedCount,
            );
            // Step 4 : update applicant status in task model from 'Pending' or 'Offering' to 'NotProceed'
            const updatedApplicant =
                await this.taskRepository.updateApplicantStatus(
                    taskId,
                    undefined,
                    ['Pending', 'Offering'],
                    'NotProceed',
                );
            await this.checkUpdatedApplication(
                updatedApplicant.acknowledged,
                updatedApplicant.matchedCount,
                updatedApplicant.modifiedCount,
            );
            // Step 5 : update task status in task model
            const updatedTask = this.taskRepository.updateStatus(
                taskId,
                'InProgress',
            );

            if (!updatedTask) {
                console.error(
                    'Update task status failed - Document not found or constraint violated.',
                );
                throw new CannotStartTaskError(
                    'Validation error - document not found or constraint violated.',
                );
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

    // To do..
    dismissOpenTask = async (taskId: string): Promise<ITaskDocument | null> => {
        const session = await this.taskRepository.startSession();
        session.startTransaction();
        try {
            // To pay 30%
            // To update status of tasks in user model
            // To update status of hiredWorkers in task model
            const updatedTask = this.taskRepository.updateStatus(
                taskId,
                'Dismissed',
            );
            if (!updatedTask) {
                throw new CannotDismissTaskError('Task not found');
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

    // To do...
    dismissInProgressTask = async (
        taskId: string,
    ): Promise<ITaskDocument | null> => {
        const session = await this.taskRepository.startSession();
        session.startTransaction();
        try {
            // To pay 30%
            // To update status of tasks in user model
            // To update status of hiredWorkers in task model
            const updatedTask = this.taskRepository.updateStatus(
                taskId,
                'Dismissed',
            );
            if (!updatedTask) {
                throw new CannotDismissTaskError('Task not found');
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
