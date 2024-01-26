import { Error as MongooseError } from 'mongoose';
import { UserModel, User, UserDocument } from '../models/UserModel';
import { ValidationError } from '../exceptions/UsersError';
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
