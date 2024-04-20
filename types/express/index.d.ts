import { Server } from 'socket.io';
import { IUserDocument } from '../../models/UserModel';

declare global {
    declare namespace Express {
        interface Request {
            user: IUserDocument;
        }

        interface Response {
            io: Server;
        }
    }
}
