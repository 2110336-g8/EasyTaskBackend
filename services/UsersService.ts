import { UsersRepository } from '../repositories/UsersRepo';
import { IUserDocument } from '../models/UserModel';
import { Service, Inject, Token } from 'typedi';
import { CannotCreateUserError } from '../errors/UsersError';
import { ValidationError } from '../errors/RepoError';
import { OtpRepository } from '../repositories/OtpRepo';
import { IRepository } from '../repositories/BaseRepo';
import { IOtpDocument } from '../models/OtpModel';

@Service()
export class UsersService {
    private userRepository: IRepository<IUserDocument>;
    private otpRepository: IRepository<IOtpDocument>;

    constructor(
        @Inject(() => UsersRepository)
        userRepository: IRepository<IUserDocument>,
        @Inject(() => OtpRepository)
        otpRepository: IRepository<IOtpDocument>,
    ) {
        this.userRepository = userRepository;
        this.otpRepository = otpRepository;
    }

    async createUser(userData: IUserDocument): Promise<IUserDocument> {
        const otpDoc = await this.otpRepository.findOne({
            email: userData.email,
        });
        if (!otpDoc) {
            throw new CannotCreateUserError('Email is not verified');
        }
        if (!otpDoc.isVerified) {
            throw new CannotCreateUserError('Email is not verified');
        }

        const existEmailUser = await this.getUserByEmail(userData.email);
        if (existEmailUser) {
            throw new CannotCreateUserError('Email is already used');
        }

        try {
            const createdUser = await this.userRepository.create(userData);
            return createdUser;
        } catch (error) {
            if (error instanceof ValidationError)
                throw new CannotCreateUserError(error.message);
            else {
                throw new Error('Unknown Error');
            }
        }
    }

    async getUserById(id: string): Promise<IUserDocument | null> {
        try {
            const user = await this.userRepository.findOne({ _id: id });
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
            const user = await this.userRepository.findOne({ email });
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

    async deleteUser(id: string, password: string) {
        throw new Error('Not Implemented');
    }
}
