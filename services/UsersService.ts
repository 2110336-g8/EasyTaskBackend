import { IUsersRepository, UsersRepository } from '../repositories/UsersRepo';
import { IUser, IUserDocument } from '../models/UserModel';
import { Service, Inject, Token } from 'typedi';
import { CannotCreateUserError } from '../errors/UsersError';
import { ValidationError } from '../errors/RepoError';
import { IOtpRepository, OtpRepository } from '../repositories/OtpRepo';
import Constants from '../config/constants';
import {
    ImagesRepository,
    IImagesRepository,
} from '../repositories/ImagesRepository';

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
    getUserProfileImage: (id: string) => Promise<string | null>;
    updateUserProfileImage: (
        userId: string,
        fileBuffer: Buffer,
        mimetype: string,
        key: string,
    ) => Promise<void>;
    deleteUserProfileImage: (userId: string, imageKey: string) => Promise<void>;
}

@Service()
export class UsersService implements IUsersService {
    private usersRepository: IUsersRepository;
    private otpRepository: IOtpRepository;
    private imagesRepository: IImagesRepository;

    constructor(
        @Inject(() => UsersRepository)
        usersRepository: IUsersRepository,
        @Inject(() => OtpRepository)
        otpRepository: IOtpRepository,
        @Inject(() => ImagesRepository)
        imagesRepository: IImagesRepository,
    ) {
        this.usersRepository = usersRepository;
        this.otpRepository = otpRepository;
        this.imagesRepository = imagesRepository;
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
            const createdUser = await this.usersRepository.create(userData);
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
            const user = await this.usersRepository.findOne(id);
            if (user) {
                const updatedUser =
                    await this.imagesRepository.updateUserImageUrl(user);
                return updatedUser;
            }
            return null;
        } catch (error) {
            console.error(error);
            return null;
        }
    };

    getUserByEmail = async (email: string): Promise<IUserDocument | null> => {
        try {
            const user = await this.usersRepository.findOneByEmail(email);
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
            const user = await this.usersRepository.update(id, data);
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
            const user = await this.usersRepository.isValidPassword(
                email,
                currentPassword,
            );
            if (!user) {
                return null;
            }
            try {
                const user = await this.usersRepository.update(id, data);
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
            const user = await this.usersRepository.isValidPassword(
                email,
                password,
            );
            if (!user) {
                return null;
            }
            try {
                if (!this.usersRepository.deleteOne(id)) {
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
    //image ------------------------------------------------------------

    async getUserProfileImage(id: string): Promise<string | null> {
        const user = await this.getUserById(id);
        if (!user) return null;

        const updatedUser =
            await this.imagesRepository.updateUserImageUrl(user);
        if (!updatedUser.imageUrl) return null;
        return updatedUser.imageUrl;
    }

    async updateUserProfileImage(
        userId: string,
        fileBuffer: Buffer,
        mimetype: string,
        key: string,
    ): Promise<void> {
        try {
            // Update the user's imageKey
            await this.updateUser(userId, {
                imageKey: key,
            } as IUserDocument);

            // Upload the file to AWS S3
            await this.imagesRepository.createImage(fileBuffer, mimetype, key);
        } catch (error) {
            throw new Error('Failed to update profile image');
        }
    }

    async deleteUserProfileImage(
        userId: string,
        imageKey: string,
    ): Promise<void> {
        try {
            // Delete the image from the repository
            const success = await this.imagesRepository.deleteImage(imageKey);
            if (success) {
                const updatedUser = await this.updateUser(userId, {
                    imageKey: null,
                    imageUrl: null,
                    imageUrlLastUpdateTime: null,
                } as IUserDocument);
                // console.log(updatedUser);
            }
        } catch (error) {
            throw new Error('Failed to delete profile image');
        }
    }
}
