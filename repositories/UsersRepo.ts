import { compare } from 'bcrypt';
import { IUser, IUserDocument, UserModel } from '../models/UserModel';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { Service } from 'typedi';

export interface IUsersRepositorty extends IRepository<IUser> {
    findOneByEmail: (email: string) => Promise<IUserDocument | null>;
    isValidPassword: (
        email: string,
        password: string,
    ) => Promise<IUserDocument | null>;
    isValidPasswordById: (
        id: string,
        password: string
    ) => Promise<IUserDocument | null>;
}

@Service()
export class UsersRepository
    extends BaseMongooseRepository<IUser>
    implements IUsersRepositorty
{
    constructor() {
        super(UserModel);
    }
    findOneByEmail = async (email: string): Promise<IUserDocument | null> => {
        const result = await this._model.findOne({ email });
        return result;
    };

    isValidPassword = async (
        email: string,
        password: string,
    ): Promise<IUserDocument | null> => {
        const user = await this._model.findOne({ email }).select('+password');
        if (!user) {
            return null;
        }
        const isValid = await compare(password, user.password);
        return isValid ? user : null;
    };

    isValidPasswordById = async (
        id: string,
        password: string
    ): Promise<IUserDocument | null> => {
        const user = await this._model.findById(id).select('+password');
        if (!user) {
            return null;
        }
        const isValid = await compare(password, user.password);
        return isValid ? user : null;
    }

}
