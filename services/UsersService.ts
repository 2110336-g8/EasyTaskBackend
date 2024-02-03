import { IUsersRepositorty, UsersRepository } from '../repositories/UsersRepo';
import { IUser, IUserDocument } from '../models/UserModel';
import { Service, Inject, Token } from 'typedi';
import { CannotCreateUserError } from '../errors/UsersError';
import { ValidationError } from '../errors/RepoError';
import { IOtpRepository, OtpRepository } from '../repositories/OtpRepo';
import Constants from '../config/constants';

export interface IUsersService {
    createUser: (userData: IUserDocument) => Promise<IUserDocument>;
    getUserById: (id: string) => Promise<IUserDocument | null>;
    getUserByEmail: (email: string) => Promise<IUserDocument | null>;
    updateUser: (
        id: string,
        data: IUserDocument,
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

    async createUser(userData: IUser): Promise<IUserDocument> {
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
    }

    async getUserById(id: string): Promise<IUserDocument | null> {
        try {
            const user = await this.userRepository.findOne(id);
            if (!user) {
                return null;
            }
            return user;
        } catch (error) {
            throw error;
        }
    }

    async getUserByEmail(email: string): Promise<IUserDocument | null> {
        try {
            const user = await this.userRepository.findOneByEmail(email);
            if (!user) {
                return null;
            }
            return user;
        } catch (error) {
            throw error;
        }
    }

    async updateUser(
        id: string,
        data: IUserDocument,
    ): Promise<IUserDocument | null> {
        try {
            const user = await this.userRepository.update(id, data);
            if (!user) {
                null;
            }
            return user;
        } catch (error) {
            throw error;
        }
    }
}
