import { IUsersRepository, UsersRepository } from '../repositories/UsersRepo';
import { IUser, IUserDocument } from '../models/UserModel';
import { Service, Inject, Token } from 'typedi';
import { CannotCreateUserError } from '../errors/UsersError';
import { ValidationError } from '../errors/RepoError';
import { IOtpRepository, OtpRepository } from '../repositories/OtpRepo';
import Constants from '../config/constants';
import { ImageService } from '../services/ImageService';

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
        email: string,
        data: IUser,
        currentPassword: string,
    ) => Promise<IUserDocument | null>;
    deleteUser: (
        id: string,
        password: string,
        email: string,
    ) => Promise<IUserDocument | null>;
}

@Service()
export class UsersService implements IUsersService {
    private userRepository: IUsersRepository;
    private otpRepository: IOtpRepository;
    private imageService: ImageService;

    constructor(
        @Inject(() => UsersRepository)
        userRepository: IUsersRepository,
        @Inject(() => OtpRepository)
        otpRepository: IOtpRepository,
        @Inject(() => ImageService)
        imageService: ImageService,
    ) {
        this.userRepository = userRepository;
        this.otpRepository = otpRepository;
        this.imageService = imageService;
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
            if (user) {
                return await this.imageService.updateUserImageUrl(user);
            }
            return null;
        } catch (error) {
            console.error(error);
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
        email: string,
        data: IUser,
        currentPassword: string,
    ): Promise<IUserDocument | null> => {
        try {
            const user = await this.userRepository.isValidPassword(
                email,
                currentPassword,
            );
            if (!user) {
                return null;
            }
            try {
                const user = await this.userRepository.update(id, data);
                return user;
            } catch (error) {
                return null;
            }
        } catch (error) {
            return null;
        }
    };

    deleteUser = async (
        id: string,
        password: string,
        email: string,
    ): Promise<IUserDocument | null> => {
        try {
            const user = await this.userRepository.isValidPassword(
                email,
                password,
            );
            if (!user) {
                return null;
            }
            try {
                if (!this.userRepository.deleteOne(id)) {
                    return null;
                }
                return user;
            } catch (error) {
                return null;
            }
        } catch (error) {
            return null;
        }
    };
}
