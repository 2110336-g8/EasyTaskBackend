import { IUsersRepositorty, UsersRepository } from '../repositories/UsersRepo';
import { IUpdatePassword, IUser, IUserDocument } from '../models/UserModel';
import { Service, Inject, Token } from 'typedi';
import { CannotCreateUserError } from '../errors/UsersError';
import { ValidationError } from '../errors/RepoError';
import { IOtpRepository, OtpRepository } from '../repositories/OtpRepo';
import Constants from '../config/constants';
import e from 'express';

export interface IUsersService {
    createUser: (userData: IUserDocument) => Promise<IUserDocument>;
    getUserById: (id: string) => Promise<IUserDocument | null>;
    getUserByEmail: (email: string) => Promise<IUserDocument | null>;
    updateUser: (
        id: string,
        data: IUserDocument,
    ) => Promise<IUserDocument | null>;
    updatePassword: (
        id: string, 
        data: IUpdatePassword
    ) => Promise<IUserDocument | null>;
}

@Service()
export class UsersService implements IUsersService {
    private userRepository: IUsersRepositorty;
    private otpRepository: IOtpRepository;

    constructor(
        @Inject(() => UsersRepository)
        userRepository: IUsersRepositorty,
        @Inject(() => OtpRepository)
        otpRepository: IOtpRepository,
    ) {
        this.userRepository = userRepository;
        this.otpRepository = otpRepository;
    }

    createUser = async (userData: IUser): Promise<IUserDocument> => {
        const existEmailUser = await this.getUserByEmail(userData.email);
        if (existEmailUser) {
            throw new CannotCreateUserError('Email is already used');
        }

        const otpDoc = await this.otpRepository.findOneByEmail(userData.email);
        if (!otpDoc) {
            throw new CannotCreateUserError('Email is not verified');
        }
        if (
            !otpDoc.isVerified ||
            new Date().getTime() - otpDoc.verifiedAt.getTime() >
                Constants.VERIFIED_CREATABLE_MIN * 60 * 1000
        ) {
            throw new CannotCreateUserError('Email is not verified');
        }

        try {
            const createdUser = await this.userRepository.create(userData);
            return createdUser;
        } catch (error) {
            if (error instanceof ValidationError)
                throw new ValidationError(error.message);
            else {
                throw new Error('Unknown Error');
            }
        }
    };

    getUserById = async (id: string): Promise<IUserDocument | null> => {
        try {
            const user = await this.userRepository.findOne(id);
            return user;
        } catch (error) {
            return null;
        }
    };

    getUserByEmail = async (email: string): Promise<IUserDocument | null> => {
        try {
            const user = await this.userRepository.findOneByEmail(email);
            return user;
        } catch (error) {
            return null;
        }
    };

    updateUser = async (
        id: string,
        data: IUserDocument,
    ): Promise<IUserDocument | null> => {
        try {
            const user = await this.userRepository.update(id, data);
            return user;
        } catch (error) {
            throw error;
        }
    };

    updatePassword = async (
        id: string,
        data: IUpdatePassword
    ): Promise<IUserDocument | null> => {
        try {
            const user = await this.userRepository.isValidPasswordById(
                id,
                data.currentPassword,
            );
            if (!user) {
                throw new ValidationError('Current password is not correct');
            }
            try {
                const user = await this.userRepository.updatePassword(id, data.newPassword);
                if (!user) {
                    throw new ValidationError('Failed to update password');
                }
            }
            catch (error) {
                return null;
            }
            return user;
        } catch (error) {
            throw error;
        }
    }
}
