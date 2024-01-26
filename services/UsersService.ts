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
                throw new ValidationError("duplicate phone number")
            } else {
                throw new Error('Unknown Error')
            }
        }
    }
}

export default UserService;
