import { Error as MongooseError } from 'mongoose';
import { UserModel, User, UserDocument } from '../models/UserModel';
import { ValidationError , UserNotFoundError} from '../exceptions/UsersError';
import { MongoError, MongoServerError } from 'mongodb';

class UserService {
    static async postUser(userData: Omit<User, '_id'>): Promise<UserDocument> {
        try {
            const newUser: UserDocument = await UserModel.create(userData);
            return newUser
        } catch (error) {
            if (error instanceof MongooseError.ValidationError) {
                throw new ValidationError(error.message)
            }
            if ((error as MongoServerError).code == 11000) {
                throw new ValidationError((error as MongoServerError).message)
            } else {
                throw new Error('Unknown Error')
            }
        }
    }

    static async getUserInformation(userId: string): Promise<UserDocument> {
        try{
            // Assuming you have a method in UserModel to find and update a user by ID
            const user = await UserModel.findById(userId);

            if (!user) {
                // Handle user not found scenario
                throw new UserNotFoundError('the given object id is not found');
            }

            return user;
        } catch (error) {
            if (error instanceof MongooseError.CastError) {
                // Handle invalid ObjectId format
                throw new ValidationError('Invalid ObjectId format');
            } else if (error instanceof UserNotFoundError){
                throw error;
            } else {
                throw new Error('Unknown Error');
            }
        }
    }

    static async deleteUser(userId: string, password: string): Promise<void> {
        try {
            // Validate input parameters
            if (!userId || !password) {
                throw new ValidationError('Object ID and password are required');
            }

            // Find the user by ID
            const user = await UserModel.findById(userId);

            if (!user) {
                // Handle user not found scenario
                throw new UserNotFoundError('User not found');
            }

            // Verify that the provided password matches the stored password
            const isPasswordValid = await user.isValidPassword(password);

            if (!isPasswordValid) {
                throw new ValidationError('Invalid password');
            }

            // If both conditions are met, delete the user
            await UserModel.findByIdAndDelete(userId);
        } catch (error) {
            if (error instanceof MongooseError.CastError) {
                // Handle invalid ObjectId format
                throw new ValidationError('Invalid ObjectId format');
            } else if (error instanceof ValidationError || error instanceof UserNotFoundError) {
                // Handle validation errors or user not found error
                throw error;
            } else {
                // Handle other errors
                throw new Error('Unknown Error');
            }
        }
    }

    static async updateUserProfile(userId: string, updatedData: any): Promise<any> {
        // Assuming you have a method in UserModel to find and update a user by ID
        const user = await UserModel.findByIdAndUpdate(userId, updatedData, { new: true });

        if (!user) {
            // Handle user not found scenario
            throw new Error('User not found');
        }

        return user;
    }

    static async isPhoneNumberExist(phoneNumber: string): Promise<boolean> {
        try {
            const user = await UserModel.findOne({ phoneNumber: phoneNumber });
            return !!user;
        } catch (error) {
            throw new Error('Unknown Error');
        }
    }
}

export default UserService;
