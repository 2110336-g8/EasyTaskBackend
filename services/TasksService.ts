import { ITask, ITaskDocument } from '../models/TaskModel';
import { ITasksRepository, TasksRepository } from '../repositories/TasksRepo';
import { IUsersRepository, UsersRepository } from '../repositories/UsersRepo';
import { ICandidate } from '../models/CandidateModel';
import {
    CannotGetTaskOfError,
    CannotApplyTaskError,
    CannotUpdateStateError,
    CannotSelectCandidateError,
    CannotResponseOfferError,
    CannotStartTaskError,
    CannotDismissTaskError,
    CannotSubmitTaskError,
    CannotAcceptTaskError,
    CannotRequestRevisionError,
} from '../errors/TaskError';
import { Inject, Service } from 'typedi';
import { ValidationError } from '../errors/RepoError';
import {
    ImagesRepository,
    IImagesRepository,
} from '../repositories/ImagesRepository';

import categoryData from '../assets/categories/categorieslist.json';
import mongoose, { FilterQuery, Types } from 'mongoose';
import { ITaskOf } from '../models/TaskOfModel';

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
    getTasksOf: (
        userId: string,
        status: string | undefined,
    ) => Promise<ITaskOf[]>;
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
    ) => Promise<void>;
    startTask: (taskId: string) => Promise<ITaskDocument | null>;
    dismissOpenTask: (taskId: string) => Promise<ITaskDocument | null>;
    dismissInProgressTask: (taskId: string) => Promise<ITaskDocument | null>;
    submitTask: (taskId: string, userId: string) => Promise<void>;
    acceptTask: (
        taskId: string,
        userId: string,
    ) => Promise<ITaskDocument | null>;
    requestRevision: (
        taskId: string,
        userId: string,
    ) => Promise<ITaskDocument | null>;
    getTasksByUserIdAndStatus(
        userId: string,
        status: string[],
    ): Promise<ITaskDocument[]>;
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

    getTasksOf = async (
        userId: string,
        status: string | undefined,
    ): Promise<ITaskOf[]> => {
        try {
            // Initialize an array to store results
            const taskOfArray: ITaskOf[] = [];

            if (status === undefined || status === '') {
                // Fetch tasks for each status and format them
                const statusList = [
                    'Pending',
                    'Offering',
                    'Accepted',
                    'Rejected',
                    'NotProceed',
                    'InProgress',
                    'Submitted',
                    'Revising',
                    'Resubmitted',
                    'Completed',
                ];

                for (const stat of statusList) {
                    const tasks = await this.getApplicationsOrTasksByStatus(
                        userId,
                        stat,
                    );
                    const result = await this.formatApplicationsOrTasksByStatus(
                        stat,
                        tasks,
                    );
                    taskOfArray.push(result);
                }
            } else {
                // Check if the provided status is valid
                if (
                    ![
                        'Pending',
                        'Offering',
                        'Accepted',
                        'Rejected',
                        'NotProceed',
                        'InProgress',
                        'Submitted',
                        'Revising',
                        'Resubmitted',
                        'Completed',
                    ].includes(status)
                ) {
                    throw new CannotGetTaskOfError('Invalid job status');
                }
                // Fetch tasks for the specified status and format them
                const tasks = await this.getApplicationsOrTasksByStatus(
                    userId,
                    status,
                );
                const result = await this.formatApplicationsOrTasksByStatus(
                    status,
                    tasks,
                );
                taskOfArray.push(result);
            }

            // Return the combined taskOfArray
            return taskOfArray;
        } catch (error) {
            throw error;
        }
    };

    getApplicationsOrTasksByStatus = async (
        userId: string,
        status: string,
    ): Promise<ITaskDocument[]> => {
        try {
            const user = await this.usersRepository.findOne(userId);
            if (!user) {
                throw new CannotGetTaskOfError('User not found');
            }
            // task is in applicantion state
            if (
                [
                    'Pending',
                    'Offering',
                    'Accepted',
                    'Rejected',
                    'NotProceed',
                ].includes(status)
            ) {
                const taskIds = user.applications
                    .filter(application => application.status === status)
                    .map(application => application.taskId);
                const tasks = await this.tasksRepository.findTasks({
                    _id: { $in: taskIds },
                });
                return tasks;
            }
            // task is ongoing
            else {
                if (status === 'Completed') {
                    const taskIds = user.tasks
                        .filter(
                            task =>
                                task.status === 'Completed' ||
                                task.status === 'Dismissed',
                        )
                        .map(task => task.taskId);
                    const tasks = await this.tasksRepository.findTasks({
                        _id: { $in: taskIds },
                    });
                    return tasks;
                } else {
                    const taskIds = user.tasks
                        .filter(task => task.status === status)
                        .map(task => task.taskId);
                    const tasks = await this.tasksRepository.findTasks({
                        _id: { $in: taskIds },
                    });
                    return tasks;
                }
            }
        } catch (error) {
            throw error;
        }
    };
    formatApplicationsOrTasksByStatus = async (
        status: string,
        tasks: ITaskDocument[],
    ): Promise<ITaskOf> => {
        const taskOf: ITaskOf = {
            status,
            tasks: [],
        };

        const formattedTasks = await Promise.all(
            tasks
                .filter(
                    task => !(status === 'Accepted' && task.status != 'Open'),
                )
                .map(async task => {
                    // Update image URL for the task
                    task = await this.imagesRepository.updateTaskImageUrl(task);

                    return {
                        taskId: task._id,
                        title: task.title,
                        category: task.category,
                        imageUrl: task.imageUrl ?? null,
                        locationName: task.location?.name ?? undefined,
                        wages: task.wages,
                        startDate: task.startDate,
                        endDate: task.endDate,
                        applicationNumber: task.applicants.length,
                    };
                }),
        );

        taskOf.tasks.push(...formattedTasks);

        return taskOf;
    };

    //adsOf
    getAdvertisement = async (
        customerId: string,
        status: string,
    ): Promise<ITaskDocument[] | null> => {
        let filter: FilterQuery<ITaskDocument> = {
            customerId: customerId,
        };

        try {
            let tasks: ITaskDocument[] = [];

            // Check if status is provided and not an empty string
            if (status && status.trim() !== '') {
                filter = {
                    ...filter,
                    status: status as
                        | 'Open'
                        | 'InProgress'
                        | 'Completed'
                        | 'Dismissed',
                };
            }

            // Fetch tasks based on the filter
            tasks = await this.tasksRepository.findTasks(filter);

            // Update image URLs for each task
            const tasksWithUpdatedUrls = await Promise.all(
                tasks.map(async task => {
                    return await this.imagesRepository.updateTaskImageUrl(task);
                }),
            );

            return tasksWithUpdatedUrls;
        } catch (error) {
            console.error(error);
            return null; // Return null in case of error
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
            // Check if there is an existing application with the same taskId
            const existingApplication = await this.usersRepository.findUser({
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
            const updatedUser = await this.usersRepository.addApplication(
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
            const existingApplicant = await this.tasksRepository.findTask({
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
            const updatedTask = await this.tasksRepository.addApplicant(
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
            await session.commitTransaction();
            session.endSession();
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
        // to return applied task
        const result = await this.tasksRepository.findOne(taskId);
        if (!result) return null;
        const resultWithImageUpdate =
            await this.imagesRepository.updateTaskImageUrl(result);

        // Format return task
        const generalInfoTask = {
            ...resultWithImageUpdate.toObject(),
            imageKey: undefined,
            applicants: undefined,
            hiredWorkers: undefined,
        };

        return generalInfoTask as ITaskDocument;
    };

    getCandidate = async (taskId: string): Promise<ICandidate | null> => {
        try {
            const task = await this.tasksRepository.findOne(taskId);
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
                const user = await this.usersRepository.findOne(
                    candidate.userId.toString(),
                );
                if (user) {
                    const userWithImageUpdate =
                        await this.imagesRepository.updateUserImageUrl(user);
                    const tmp = {
                        userId: user.id.toString(),
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        phoneNumber: user.phoneNumber,
                        description: user.description,
                        imageUrl: userWithImageUpdate.imageUrl,
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

    updateApplicationState = async (
        taskId: string,
        userIds: string[] | undefined,
        oldStatus: string[],
        newStatus: string,
    ): Promise<void> => {
        // update applicant status in task model
        const updatedApplicant =
            await this.tasksRepository.updateApplicantStatus(
                taskId,
                userIds,
                oldStatus,
                newStatus,
            );
        // check update result
        await this.checkStateUpdate(
            updatedApplicant.acknowledged,
            updatedApplicant.matchedCount,
            updatedApplicant.modifiedCount,
        );

        // update application status in user model
        const updatedApplication =
            await this.usersRepository.updateApplicationStatus(
                taskId,
                userIds,
                oldStatus,
                newStatus,
            );
        // check update result
        await this.checkStateUpdate(
            updatedApplication.acknowledged,
            updatedApplication.matchedCount,
            updatedApplication.modifiedCount,
        );
    };

    updateTaskState = async (
        taskId: string,
        userIds: string[] | undefined,
        oldStatus: string[],
        newStatus: string,
    ): Promise<void> => {
        // update hired worker status in task model
        const updatedHiredWorker =
            await this.tasksRepository.updateHiredWorkerStatus(
                taskId,
                userIds,
                oldStatus,
                newStatus,
            );
        // check update result
        await this.checkStateUpdate(
            updatedHiredWorker.acknowledged,
            updatedHiredWorker.matchedCount,
            updatedHiredWorker.modifiedCount,
        );

        // update task status in user model
        const updatedTask = await this.usersRepository.updateTaskStatus(
            taskId,
            userIds,
            oldStatus,
            newStatus,
        );
        // check update result
        await this.checkStateUpdate(
            updatedTask.acknowledged,
            updatedTask.matchedCount,
            updatedTask.modifiedCount,
        );
    };

    // Check result of calling this.taskRepository.updateApplicantStatus
    // Check result of calling this.userRepository.updateApplicationStatus
    // Check result of calling this.taskRepository.updateHiredWorkerStatus
    // Check result of calling this.userRepository.updateTaskStatus
    checkStateUpdate = async (
        acknowledged: boolean,
        matchedCount: number,
        modifiedCount: number,
    ): Promise<null> => {
        if (!acknowledged) {
            throw new CannotUpdateStateError(
                'Update operation failed: Unexpected result.',
            );
        }
        if (matchedCount != modifiedCount) {
            throw new CannotUpdateStateError(
                'Update operation failed: Matched count does not match modified count.',
            );
        }
        return null;
    };

    selectCandidate = async (
        taskId: string,
        selectedCandidates: string[],
    ): Promise<ICandidate> => {
        // Check validation of selectedCandidateds
        const task = await this.tasksRepository.findOne(taskId);
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
        // update data
        const session = await this.tasksRepository.startSession();
        session.startTransaction();
        try {
            // update application of selected candidated
            await this.updateApplicationState(
                taskId,
                selectedCandidates,
                ['Pending'],
                'Offering',
            );
            await session.commitTransaction();
            session.endSession();
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('Error occurred while selecting candidates:', error);
            throw error;
        }
        // get Candidate result to return
        const candidate = await this.getCandidate(taskId);
        if (!candidate) {
            console.error(
                'Cannot get candidate information after selection, but the selection is successful',
            );
            throw new CannotSelectCandidateError(`Task not found`);
        }
        return candidate;
    };

    responseOffer = async (
        taskId: string,
        userId: string,
        response: boolean,
    ): Promise<void> => {
        // if response = true, set status to 'Accepted', else set to 'Rejected'
        const status = response ? 'Accepted' : 'Rejected';
        const session = await this.tasksRepository.startSession();
        session.startTransaction();
        try {
            const task = await this.tasksRepository.findOne(taskId);
            if (!task) {
                throw new CannotResponseOfferError('Task not found');
            }
            // task has been started, cannot response offer anymore
            if (task.status !== 'Open') {
                throw new CannotResponseOfferError(
                    'Task is not open for accepting or rejecting applicants',
                );
            }

            // check if user have this task offer
            const validUser = task.applicants.filter(
                applicant => applicant.userId.toString() === userId,
            );
            if (validUser.length != 1 || validUser[0].status != 'Offering') {
                throw new CannotResponseOfferError(
                    'You have no offer from this task',
                );
            }

            // count accepted applicants
            const acceptedApplicantsCount = task.applicants.filter(
                applicant => applicant.status === 'Accepted',
            ).length;

            // update application of user who accept/reject the offer
            await this.updateApplicationState(
                taskId,
                [userId],
                ['Offering'],
                status,
            );

            // check acceptance availability of this task
            // if task seat is full, change status of other pending or offering applicaiton to 'NotProceed'
            if (response && acceptedApplicantsCount + 1 >= task.workers) {
                // update application of other user
                await this.updateApplicationState(
                    taskId,
                    undefined,
                    ['Pending', 'Offering'],
                    'NotProceed',
                );
            }
            await session.commitTransaction();
            session.endSession();
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    };

    startTask = async (taskId: string): Promise<ITaskDocument | null> => {
        const timestamps = new Date();
        const session = await this.tasksRepository.startSession();
        session.startTransaction();
        try {
            const task = await this.tasksRepository.findOne(taskId);
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
                throw new CannotStartTaskError(
                    'This task has no accepted candidates',
                );
            }
            // Step 2 : adding data in user and task model
            for (const applicant of acceptedApplicants) {
                // Step 2-1 : add task in user data
                // Check if there is an existing task with the same taskId
                const existingTask = await this.usersRepository.findUser({
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
                const updatedUser = await this.usersRepository.addTask(
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
                const existingHiredWorker = await this.tasksRepository.findTask(
                    {
                        _id: taskId,
                        'hiredWorkers.userId': applicant,
                    },
                );

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
                const updatedTask = await this.tasksRepository.addHiredWorker(
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

            // Step 3 : update application status from 'Pending' or 'Offering' to 'NotProceed'
            // update application of other user
            await this.updateApplicationState(
                taskId,
                undefined,
                ['Pending', 'Offering'],
                'NotProceed',
            );

            // Step 4 : update task status in task model
            const updatedTask = await this.tasksRepository.updateStatus(
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

            const updatedTaskWithImageUpdate =
                await this.imagesRepository.updateTaskImageUrl(updatedTask);
            await session.commitTransaction();
            session.endSession();
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
        // to return update task
        const result = await this.tasksRepository.findOne(taskId);
        if (!result) return null;
        const resultWithImageUpdate =
            await this.imagesRepository.updateTaskImageUrl(result);
        return resultWithImageUpdate;
    };

    dismissOpenTask = async (taskId: string): Promise<ITaskDocument | null> => {
        const session = await this.tasksRepository.startSession();
        session.startTransaction();
        try {
            // Step 1 : update application status that is not 'Rejected' to 'NotProceed'
            // update application state
            await this.updateApplicationState(
                taskId,
                undefined,
                ['Pending', 'Offering', 'Accepted'],
                'NotProceed',
            );

            // Step 2: update task status to 'Dismissed'
            const updatedTask = await this.tasksRepository.updateStatus(
                taskId,
                'Dismissed',
            );
            if (!updatedTask) {
                throw new CannotDismissTaskError('Task not found');
            }
            await session.commitTransaction();
            session.endSession();
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
        // to return update task
        const result = await this.tasksRepository.findOne(taskId);
        if (!result) return null;
        const resultWithImageUpdate =
            await this.imagesRepository.updateTaskImageUrl(result);
        return resultWithImageUpdate;
    };

    dismissInProgressTask = async (
        taskId: string,
    ): Promise<ITaskDocument | null> => {
        const session = await this.tasksRepository.startSession();
        session.startTransaction();
        try {
            // Payment procedure
            // To pay 30%
            // To return 70%
            //

            // Step 1 : update (individual) task status that is not 'Completed' to 'Dismissed'
            // update task state
            await this.updateTaskState(
                taskId,
                undefined,
                ['InProgress', 'Submitted', 'Revising', 'Resubmitted'],
                'Dismissed',
            );

            // Step 2: update task status to 'Dismissed'
            const updatedTask = await this.tasksRepository.updateStatus(
                taskId,
                'Dismissed',
            );

            if (!updatedTask) {
                throw new CannotDismissTaskError('Task not found');
            }

            await session.commitTransaction();
            session.endSession();
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
        // to return update task
        const result = await this.tasksRepository.findOne(taskId);
        if (!result) return null;
        const resultWithImageUpdate =
            await this.imagesRepository.updateTaskImageUrl(result);
        return resultWithImageUpdate;
    };

    submitTask = async (taskId: string, userId: string): Promise<void> => {
        const session = await this.tasksRepository.startSession();
        session.startTransaction();
        try {
            // Step 1 : check if request is valid
            const task = await this.tasksRepository.findOne(taskId);
            if (!task) {
                throw new CannotSubmitTaskError('Task not found');
            }
            // the task status (overall) must be 'InProgress'
            if (task.status != 'InProgress') {
                throw new CannotSubmitTaskError(
                    'This task has not yet started, been dismissed, or completed.',
                );
            }
            const validUser = task.hiredWorkers.filter(
                worker => worker.userId.toString() === userId,
            );
            // the task state must be 'InProgress' or 'Revising'
            if (
                validUser.length != 1 ||
                !['InProgress', 'Revising'].includes(validUser[0].status)
            ) {
                throw new CannotSubmitTaskError(
                    'You are not working on this task',
                );
            }
            // Step 2 : update (individual) task status of the user to 'Submitted' or 'Resubmitted'
            // update task state
            if (validUser[0].status === 'InProgress') {
                await this.updateTaskState(
                    taskId,
                    [userId],
                    ['InProgress'],
                    'Submitted',
                );
            } else {
                await this.updateTaskState(
                    taskId,
                    [userId],
                    ['Revising'],
                    'Resubmitted',
                );
            }
            await session.commitTransaction();
            session.endSession();
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    };

    acceptTask = async (
        taskId: string,
        userId: string,
    ): Promise<ITaskDocument | null> => {
        const session = await this.tasksRepository.startSession();
        session.startTransaction();
        try {
            // Step 1 : check if request is valid
            const task = await this.tasksRepository.findOne(taskId);
            if (!task) {
                throw new CannotAcceptTaskError('Task not found');
            }
            const validUser = task.hiredWorkers.filter(
                worker => worker.userId.toString() === userId,
            );
            // the task state must be 'Submitted' or 'Resubmitted'
            if (
                validUser.length != 1 ||
                !['Submitted', 'Resubmitted'].includes(validUser[0].status)
            ) {
                throw new CannotSubmitTaskError(
                    'Employee is not assigned to this task or has not submitted any work.',
                );
            }
            // Step 2 : update (individual) task status of the user to 'Completed'
            // update task state
            await this.updateTaskState(
                taskId,
                [userId],
                ['Submitted, Resubmitted'],
                'Completed',
            );
            // Step 3 : Check if every worker (employee) has completed the task.
            // If every worker has completed the task, change the task status (overall) to 'Completed'.
            const completedWorker = task.hiredWorkers.filter(
                worker => worker.status === 'Completed',
            );
            if (completedWorker.length + 1 === task.hiredWorkers.length) {
                const updatedTask = await this.tasksRepository.updateStatus(
                    taskId,
                    'Completed',
                );
                if (!updatedTask) {
                    throw new CannotAcceptTaskError('Task not found');
                }
            }
            await session.commitTransaction();
            session.endSession();
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
        // to return update task
        const result = await this.tasksRepository.findOne(taskId);
        if (!result) return null;
        const resultWithImageUpdate =
            await this.imagesRepository.updateTaskImageUrl(result);
        return resultWithImageUpdate;
    };

    requestRevision = async (
        taskId: string,
        userId: string,
    ): Promise<ITaskDocument | null> => {
        const session = await this.tasksRepository.startSession();
        session.startTransaction();
        try {
            // Step 1 : check if request is valid
            const task = await this.tasksRepository.findOne(taskId);
            if (!task) {
                throw new CannotRequestRevisionError('Task not found');
            }
            const validUser = task.hiredWorkers.filter(
                worker => worker.userId.toString() === userId,
            );
            // the task state must be 'Submitted'
            if (
                validUser.length != 1 ||
                !['Submitted'].includes(validUser[0].status)
            ) {
                throw new CannotRequestRevisionError(
                    'Employee is not assigned to this task or has not submitted any work.',
                );
            }
            // Step 2 : update (individual) task status of the user to 'Revising'
            // update task state
            await this.updateTaskState(
                taskId,
                [userId],
                ['Submitted'],
                'Revising',
            );
            await session.commitTransaction();
            session.endSession();
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
        // to return update task
        const result = await this.tasksRepository.findOne(taskId);
        if (!result) return null;
        const resultWithImageUpdate =
            await this.imagesRepository.updateTaskImageUrl(result);
        return resultWithImageUpdate;
    };

    getTasksByUserIdAndStatus = async (
        userId: string,
        status: string[],
    ): Promise<ITaskDocument[]> => {
        const tasks = await this.tasksRepository.findTasksByUserIdAndStatus(
            userId,
            status,
        );
        return Promise.all(
            tasks.map(async task => {
                return await this.imagesRepository.updateTaskImageUrl(task);
            }),
        );
    };
}
