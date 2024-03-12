import { compare } from 'bcrypt';
import { IUser, IUserDocument, UserModel } from '../models/UserModel';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { Service } from 'typedi';

export interface IUsersRepositorty extends IRepository<IUser> {
    findOneByEmail: (email: string) => Promise<IUserDocument | null>;
    isValidPassword: (
        email: string,
        password: string,
    ) => Promise<IUserDocument | null>;
    addApplications: (
        taskId: string,
        userId: string,
        timestamps: Date,
    ) => Promise<IUserDocument | null>;
    rejectAllApplicationsForOneTask: (taskId: string) => Promise<null>;
}

@Service()
export class UsersRepository
    extends BaseMongooseRepository<IUser>
    implements IUsersRepositorty
{
    constructor() {
        super(UserModel);
    }
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

    addApplications = async (
        taskId: string,
        userId: string,
        timestamps: Date,
    ): Promise<IUserDocument | null> => {
        try {
            // Check if there is an existing application with the same taskId
            const existingApplication = await this._model.findOne(
                { _id: userId, 'applications.taskId': taskId },
                { 'applications.$': 1 },
            );

            // If an applications with the same taskId exists and its status is "Pending" or "Accepted", return null
            if (
                existingApplication &&
                ['Pending', 'Accepted'].includes(
                    existingApplication.applications[0].status,
                )
            ) {
                console.error(
                    'Update failed: An application with the same taskId already exists with status "Pending" or "Accepted"',
                );
                return null;
            }

            // If no existing application with the same taskId or its status is not "Pending" or "Accepted", proceed with the update
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
            if (!updatedUser) {
                console.error(
                    'Update failed: Document not found or constraint violated',
                );
                return null;
            }
            return updatedUser;
        } catch (error) {
            console.error('Error updating applications:', error);
            throw error;
        }
    };

    rejectAllApplicationsForOneTask = async (taskId: string): Promise<null> => {
        try {
            // Update all users with applications having the specific taskId to set their status to 'Rejected'
            await this._model.updateMany(
                { 'applications.taskId': taskId },
                { $set: { 'applications.$.status': 'Rejected' } },
            );
            return null;
        } catch (error) {
            console.error('Error updating applications:', error);
            throw error;
        }
    };
}
