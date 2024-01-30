import { IUserDocument, UserModel } from "../models/UserModel";
import { BaseMongooseRepository } from "./_BaseRepo";
import { Service } from "typedi";

@Service()
export class UsersRepository extends BaseMongooseRepository<IUserDocument> {
    constructor() {
        super(UserModel);
    }

    async findOneByUsername(username: string): Promise<IUserDocument> {
        const user = await this._model.findOne({ username });
        return user as IUserDocument;
    }
}
