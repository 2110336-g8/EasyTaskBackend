import { compare } from 'bcrypt';
import { IUser, IUserDocument, UserModel } from '../models/UserModel';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { Service } from 'typedi';
import { FilterQuery, Types } from 'mongoose';

export interface IUsersRepository extends IRepository<IUser> {
    findById: (id: string) => Promise<IUserDocument | null>;
    findOneByEmail: (email: string) => Promise<IUserDocument | null>;
    isValidPassword: (
        email: string,
        password: string,
    ) => Promise<IUserDocument | null>;
    findUsers: (
        filter?: FilterQuery<IUserDocument>,
    ) => Promise<IUserDocument[]>;
    findUser: (
        filter?: FilterQuery<IUserDocument>,
    ) => Promise<IUserDocument | null>;
    addOwnedTasks: (
        taskId: string,
        userId: string,
    ) => Promise<IUserDocument | null>;
    addApplication: (
        taskId: string,
        userId: string,
        timestamps: Date,
    ) => Promise<IUserDocument | null>;
    updateApplicationStatus: (
        taskId: string,
        userId: string[] | undefined,
        oldStatus: string[],
        newStatus: string,
    ) => Promise<{
        acknowledged: boolean;
        matchedCount: number;
        modifiedCount: number;
    }>;

    addTask: (
        taskId: string,
        userId: string,
        timestamps: Date,
    ) => Promise<IUserDocument | null>;
    updateTaskStatus: (
        taskId: string,
        userId: string | undefined,
        oldStatus: string[],
        newStatus: string,
    ) => Promise<null>;
}

@Service()
export class UsersRepository
    extends BaseMongooseRepository<IUser>
    implements IUsersRepository
{
    constructor() {
        super(UserModel);
    }

    findById = async (id: string): Promise<IUserDocument | null> => {
        try {
            const user = await this._model.findById(id);
            return user;
        } catch (error) {
            throw error;
        }
    };

    findOneByEmail = async (email: string): Promise<IUserDocument | null> => {
        const result = await this._model.findOne({ email });
        return result;
    };

    isValidPassword = async (
        email: string,
        password: string,
    ): Promise<IUserDocument | null> => {
        const user = await this._model.findOne({ email }).select('+password');
        if (!user) {
            return null;
        }
        const isValid = await compare(password, user.password);
        return isValid ? user : null;
    };

    findUser = async (
        filter: FilterQuery<IUserDocument> = {},
    ): Promise<IUserDocument | null> => {
        try {
            const user = await this._model.findOne(filter);
            return user;
        } catch (error) {
            console.error('Error finding user:', error);
            throw error;
        }
    };

    findUsers = async (
        filter: FilterQuery<IUserDocument> = {},
    ): Promise<IUserDocument[]> => {
        try {
            const users = await this._model.find(filter);
            return users;
        } catch (error) {
            console.error('Error finding users:', error);
            throw error;
        }
    };

    addOwnedTasks = async (
        taskId: string,
        userId: string,
    ): Promise<IUserDocument | null> => {
        try {
            const updatedUser = await this._model.findOneAndUpdate(
                { _id: userId },
                {
                    $push: {
                        ownedTasks: taskId,
                    },
                },
                { new: true },
            );
            return updatedUser;
        } catch (error) {
            console.error('Error updating ownedTasks:', error);
            throw error;
        }
    };

    addApplication = async (
        taskId: string,
        userId: string,
        timestamps: Date,
    ): Promise<IUserDocument | null> => {
        try {
            const updatedUser = await this._model.findOneAndUpdate(
                { _id: userId },
                {
                    $push: {
                        applications: {
                            taskId: taskId,
                            createdAt: timestamps,
                        },
                    },
                },
                { new: true },
            );
            return updatedUser;
        } catch (error) {
            console.error('Error adding application:', error);
            throw error;
        }
    };

    updateApplicationStatus = async (
        taskId: string,
        userId: string[] | undefined,
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
                'applications.taskId': taskId,
                'applications.status': { $in: oldStatus },
            };

            // If userId is defined and not empty, add it to the query
            if (userId && userId.length > 0) {
                baseQuery['_id'] = { $in: userId };
            }

            // Update the status to newStatus for applications matching the query
            const result = await this._model.updateMany(
                baseQuery,
                { $set: { 'applications.$[elem].status': newStatus } }, // Update the status for all matching elements
                {
                    arrayFilters: [
                        {
                            'elem.taskId': { $in: taskId },
                            'elem.status': { $in: oldStatus },
                        },
                    ],
                }, // Filter the elements to update
            );
            console.log(baseQuery);
            console.log(result);
            return {
                acknowledged: result.acknowledged,
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
            };
        } catch (error) {
            console.error('Error updating application status:', error);
            throw error;
        }
    };

    addTask = async (
        taskId: string,
        userId: string,
        timestamps: Date,
    ): Promise<IUserDocument | null> => {
        try {
            const updatedUser = await this._model.findOneAndUpdate(
                { _id: userId },
                {
                    $push: {
                        tasks: {
                            taskId: taskId,
                            createdAt: timestamps,
                        },
                    },
                },
                { new: true },
            );
            return updatedUser;
        } catch (error) {
            console.error('Error adding task:', error);
            throw error;
        }
    };

    // to edit
    updateTaskStatus = async (
        taskId: string,
        userId: string | undefined,
        oldStatus: string[],
        newStatus: string,
    ): Promise<null> => {
        try {
            // Construct the base query without considering userId
            const baseQuery: any = {
                'tasks.taskId': taskId,
                'tasks.status': { $in: oldStatus },
            };

            // If userId is defined, add it to the query
            if (userId) {
                baseQuery['_id'] = userId;
            }

            // Update the status to newStatus for applications matching the query
            await this._model.updateMany(baseQuery, {
                $set: { 'tasks.$.status': newStatus },
            });

            return null;
        } catch (error) {
            console.error('Error updating task status:', error);
            throw error;
        }
    };
}
