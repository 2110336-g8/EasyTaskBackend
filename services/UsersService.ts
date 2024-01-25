import { Error as MongooseError } from 'mongoose';
import { UserModel, User, UserDocument } from '../models/UserModel';
import { ValidationError } from '../exceptions/UsersError';

class UserService {
    static async postUser(userData: Omit<User, '_id'>): Promise<UserDocument> {
        try {
            console.log(userData)
            const newUser: UserDocument = await UserModel.create(userData);
            return newUser;
        } catch (error) {
            if (error instanceof MongooseError.ValidationError) {
                // Convert Mongoose validation error to custom error
                throw new ValidationError(error.message);
            } else {
                // Handle other database errors
                throw new Error('Error creating user');
            }
        }
    }
}

export default UserService;