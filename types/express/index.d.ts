import { IUserDocument } from '../../models/UserModel';

declare global {
    declare namespace Express {
        interface Request {
            user: IUserDocument;
        }
    }
}
