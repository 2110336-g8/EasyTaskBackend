import { Error as MongooseError } from 'mongoose'
import { UserModel, IUser, IUserDocument } from '../models/UserModel'
import {
    UserValidationError,
    UserNotFoundError,
} from '../exceptions/UsersError'
import { MongoError, MongoServerError } from 'mongodb'

class UserService {
    static async CreateUser(
        userData: Omit<IUser, '_id'>,
    ): Promise<IUserDocument> {
        try {
            const newUser: IUserDocument = await UserModel.create(userData)
            return newUser
        } catch (error) {
            if (error instanceof MongooseError.ValidationError) {
                throw new UserValidationError(error.message)
            }
            if ((error as MongoServerError).code == 11000) {
                throw new UserValidationError(
                    (error as MongoServerError).message,
                )
            } else {
                throw new Error('Unknown Error')
            }
        }
    }

    static async getUserById(userId: string): Promise<IUserDocument> {
        try {
            const user = await UserModel.findById(userId)
            if (!user) {
                throw new UserNotFoundError()
            }
            return user
        } catch (error) {
            if (error instanceof MongooseError.CastError) {
                throw new UserValidationError('Invalid ObjectId format')
            } else if (error instanceof UserNotFoundError) {
                throw error
            } else {
                throw new Error('Unknown Error')
            }
        }
    }

    static async deleteUser(userId: string, password: string): Promise<void> {
        try {
            // Validate input parameters
            if (!userId || !password) {
                throw new UserValidationError(
                    'Object ID and password are required',
                )
            }

            // Find the user by ID
            const user = await UserModel.findById(userId)

            if (!user) {
                // Handle user not found scenario
                throw new UserNotFoundError('User not found')
            }

            // Verify that the provided password matches the stored password
            const isPasswordValid = await user.isValidPassword(password)

            if (!isPasswordValid) {
                throw new UserValidationError('Invalid password')
            }

            // If both conditions are met, delete the user
            await UserModel.findByIdAndDelete(userId)
        } catch (error) {
            if (error instanceof MongooseError.CastError) {
                // Handle invalid ObjectId format
                throw new UserValidationError('Invalid ObjectId format')
            } else if (
                error instanceof UserValidationError ||
                error instanceof UserNotFoundError
            ) {
                // Handle validation errors or user not found error
                throw error
            } else {
                // Handle other errors
                throw new Error('Unknown Error')
            }
        }
    }

    static async updateUser(
        userId: string,
        updatedData: Partial<IUserDocument>,
    ): Promise<IUserDocument> {
        try {
            // Assuming you have a method in UserModel to find and update a user by ID
            const user = await UserModel.findByIdAndUpdate(
                userId,
                updatedData,
                {
                    new: true,
                    runValidators: true,
                },
            )
            if (!user) {
                // Handle user not found scenario
                throw new UserNotFoundError()
            }
            return user
        } catch (error) {
            if (error instanceof MongooseError.CastError) {
                throw new UserValidationError(error.message)
            } else if (error instanceof MongooseError.ValidationError) {
                throw new UserValidationError(error.message)
            } else if ((error as MongoServerError).code == 11000) {
                throw new UserValidationError(
                    (error as MongoServerError).message,
                )
            } else if (error instanceof UserNotFoundError) {
                throw error
            } else {
                throw new Error('Unknown Error')
            }
        }
    }

    static async isPhoneNumberExist(phoneNumber: string): Promise<boolean> {
        try {
            const user = await UserModel.findOne({ phoneNumber: phoneNumber })
            return !!user
        } catch (error) {
            throw new Error('Unknown Error')
        }
    }
}

export default UserService
