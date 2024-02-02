import { IUserDocument, UserModel } from '../models/UserModel';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { Service } from 'typedi';

export interface IUsersRepositorty extends IRepository<IUserDocument> {
    findOneByEmail: (email: string) => Promise<IUserDocument | null>;
}

@Service()
export class UsersRepository
    extends BaseMongooseRepository<IUserDocument>
    implements IUsersRepositorty
{
    constructor() {
        super(UserModel);
    }
    async findOneByEmail(email: string): Promise<IUserDocument | null> {
        const result = await this._model.findOne({ email });
        return result;
    }
}
