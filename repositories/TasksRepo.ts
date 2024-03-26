import { ITask, ITaskDocument, TaskModel } from '../models/TaskModel';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { Service } from 'typedi';
import { FilterQuery, Types } from 'mongoose';
import { mongo } from 'mongoose';

export interface ITasksRepository extends IRepository<ITask> {
    findTasksByPage: (
        page: number,
        taskPerPage: number,
        filter?: FilterQuery<ITaskDocument>,
    ) => Promise<{ tasks: ITaskDocument[]; count: number }>;
    countAllTasks: () => Promise<number | null>;
    findTasks: (
        filter?: FilterQuery<ITaskDocument>,
    ) => Promise<ITaskDocument[]>;
    findTask: (
        filter?: FilterQuery<ITaskDocument>,
    ) => Promise<ITaskDocument | null>;
    findOneWithGeneralInfo: (id: string) => Promise<ITaskDocument | null>;
    updateStatus: (
        taskId: string,
        status: string,
    ) => Promise<ITaskDocument | null>;
    addApplicant: (
        taskId: string,
        userId: string,
        timestamps: Date,
    ) => Promise<ITaskDocument | null>;
    updateApplicantStatus: (
        taskId: string,
        userId: string[] | undefined,
        oldStatus: string[],
        newStatus: string,
    ) => Promise<{
        acknowledged: boolean;
        matchedCount: number;
        modifiedCount: number;
    }>;
    addHiredWorker: (
        taskId: string,
        userId: string,
        timestamps: Date,
        // session: mongo.ClientSession,
    ) => Promise<ITaskDocument | null>;
    updateHiredWorkerStatus: (
        taskId: string,
        userId: string[] | undefined,
        oldStatus: string[],
        newStatus: string,
    ) => Promise<{
        acknowledged: boolean;
        matchedCount: number;
        modifiedCount: number;
    }>;
    findTasksByUserIdAndStatus: (
        userId: string,
        status: string[],
    ) => Promise<ITaskDocument[]>;
}

@Service()
export class TasksRepository
    extends BaseMongooseRepository<ITask>
    implements ITasksRepository
{
    constructor() {
        super(TaskModel);
    }
    findTasksByUserIdAndStatus = async (
        userId: string,
        status: string[],
    ): Promise<ITaskDocument[]> => {
        return await this._model.aggregate([
            {
                $match: {
                    $and: [
                        { status: { $in: status } },
                        {
                            $or: [
                                {
                                    'hiredWorkers.userId': new Types.ObjectId(
                                        userId,
                                    ),
                                },
                                {
                                    customerId: new Types.ObjectId(userId),
                                },
                            ],
                        },
                    ],
                },
            },
        ]);
    };

    findTasksByPage = async (
        page: number,
        taskPerPage: number,
        filter: FilterQuery<ITaskDocument> = {},
    ): Promise<{ tasks: ITaskDocument[]; count: number }> => {
        const tasks = await this._model
            .find(filter)
            .select({
                applicants: 0,
                hiredWorkers: 0,
            })
            .skip((page - 1) * taskPerPage)
            .limit(taskPerPage);

        const count = await this._model.countDocuments(filter);

        return { tasks, count };
    };

    async countAllTasks(): Promise<number> {
        const count = await this._model.countDocuments();
        return count;
    }

    async findTasks(
        filter: FilterQuery<ITaskDocument> = {},
    ): Promise<ITaskDocument[]> {
        try {
            const tasks = await this._model.find(filter);
            return tasks;
        } catch (error) {
            console.error('Error finding tasks:', error);
            throw error;
        }
    }

    findTask = async (
        filter: FilterQuery<ITaskDocument> = {},
    ): Promise<ITaskDocument | null> => {
        try {
            const task = await this._model.findOne(filter);
            return task;
        } catch (error) {
            console.error('Error finding task:', error);
            throw error;
        }
    };

    findOneWithGeneralInfo = async (
        id: string,
    ): Promise<ITaskDocument | null> => {
        try {
            const task = await this._model.findById(id).select({
                applicants: 0,
                hiredWorkers: 0,
            });
            return task;
        } catch (error) {
            return null;
        }
    };

    updateStatus = async (
        taskId: string,
        status: string,
    ): Promise<ITaskDocument | null> => {
        try {
            const result = await this._model.findOneAndUpdate(
                { _id: taskId }, // Filter: find task by its ID
                { $set: { status: status } }, // Update status to the provided value
                { new: true }, // Return the updated document
            );
            return result;
        } catch (error) {
            console.error('Error updating task status:', error);
            throw error;
        }
    };

    addApplicant = async (
        taskId: string,
        userId: string,
        timestamps: Date,
    ): Promise<ITaskDocument | null> => {
        try {
            const updatedTask = await this._model.findOneAndUpdate(
                { _id: taskId },
                {
                    $push: {
                        applicants: {
                            userId: userId,
                            createdAt: timestamps,
                        },
                    },
                },
                { new: true },
            );
            return updatedTask;
        } catch (error) {
            console.error('Error adding applicant:', error);
            throw error;
        }
    };

    updateApplicantStatus = async (
        taskId: string,
        userId: string[] | undefined, // Allow userId to be undefined
        oldStatus: string[],
        newStatus: string,
    ): Promise<{
        acknowledged: boolean;
        matchedCount: number;
        modifiedCount: number;
    }> => {
        try {
            // Construct the base query without considering userId
            const baseQuery: any = {
                _id: taskId,
                'applicants.status': { $in: oldStatus },
            };

            // If userId is defined and not empty, add it to the query
            if (userId && userId.length > 0) {
                baseQuery['applicants.userId'] = { $in: userId };
                // Update the status to newStatus for applicants matching the query
                const result = await this._model.updateMany(
                    baseQuery,
                    { $set: { 'applicants.$[elem].status': newStatus } },
                    {
                        arrayFilters: [
                            {
                                'elem.userId': { $in: userId },
                                'elem.status': { $in: oldStatus },
                            },
                        ],
                    }, // Filter the elements to update
                );
                return {
                    acknowledged: result.acknowledged,
                    matchedCount: result.matchedCount,
                    modifiedCount: result.modifiedCount,
                };
            } else {
                // Update the status to newStatus for applicants matching the query
                const result = await this._model.updateMany(
                    baseQuery,
                    { $set: { 'applicants.$[elem].status': newStatus } },
                    {
                        arrayFilters: [
                            {
                                'elem.status': { $in: oldStatus },
                            },
                        ],
                    }, // Filter the elements to update
                );
                return {
                    acknowledged: result.acknowledged,
                    matchedCount: result.matchedCount,
                    modifiedCount: result.modifiedCount,
                };
            }
        } catch (error) {
            console.error('Error updating applicant status:', error);
            throw error;
        }
    };

    addHiredWorker = async (
        taskId: string,
        userId: string,
        timestamps: Date,
        // session: mongo.ClientSession,
    ): Promise<ITaskDocument | null> => {
        try {
            const updatedTask = await this._model.findOneAndUpdate(
                { _id: taskId },
                {
                    $push: {
                        hiredWorkers: {
                            userId: userId,
                            createdAt: timestamps,
                        },
                    },
                },
                { new: true },
            );
            return updatedTask;
        } catch (error) {
            console.error('Error adding hired worker:', error);
            throw error;
        }
    };

    updateHiredWorkerStatus = async (
        taskId: string,
        userId: string[] | undefined, // Allow userId to be undefined
        oldStatus: string[],
        newStatus: string,
    ): Promise<{
        acknowledged: boolean;
        matchedCount: number;
        modifiedCount: number;
    }> => {
        try {
            // Construct the base query without considering userId
            const baseQuery: any = {
                _id: taskId,
                'hiredWorkers.status': { $in: oldStatus },
            };

            // If userId is defined and not empty, add it to the query
            if (userId && userId.length > 0) {
                baseQuery['hiredWorkers.userId'] = { $in: userId };
                // Update the status to newStatus for hired workers matching the query
                const result = await this._model.updateMany(
                    baseQuery,
                    { $set: { 'hiredWorkers.$[elem].status': newStatus } },
                    {
                        arrayFilters: [
                            {
                                'elem.userId': { $in: userId },
                                'elem.status': { $in: oldStatus },
                            },
                        ],
                    }, // Filter the elements to update
                );
                return {
                    acknowledged: result.acknowledged,
                    matchedCount: result.matchedCount,
                    modifiedCount: result.modifiedCount,
                };
            } else {
                // Update the status to newStatus for hired workers matching the query
                const result = await this._model.updateMany(
                    baseQuery,
                    { $set: { 'hiredWorkers.$[elem].status': newStatus } },
                    {
                        arrayFilters: [
                            {
                                'elem.status': { $in: oldStatus },
                            },
                        ],
                    }, // Filter the elements to update
                );
                return {
                    acknowledged: result.acknowledged,
                    matchedCount: result.matchedCount,
                    modifiedCount: result.modifiedCount,
                };
            }
        } catch (error) {
            console.error('Error updating hired worker status:', error);
            throw error;
        }
    };
}
