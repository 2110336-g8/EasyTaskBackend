import { NextFunction, Request, Response } from 'express';
import { Inject, Service } from 'typedi';
import { IMessagesService, MessagesService } from '../services/MessagesService';
import { CannotJoinRoomError } from '../errors/MessagesError';

@Service()
export default class MessagesMiddleware {
    constructor(
        @Inject(() => MessagesService)
        private messagesService: IMessagesService,
    ) {}
    authorizeUserFetchMessages = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const taskId = req.params.id;
            const userId = req.user._id;
            await this.messagesService.isJoinableIdRoom(taskId, userId);
            next();
        } catch (error) {
            console.log(error);
            if (error instanceof CannotJoinRoomError) {
                return res.status(403).json({
                    error: error.name,
                    details: error.message,
                });
            } else {
                return res.status(500).json({
                    error: 'Internal server error',
                });
            }
        }
    };
}
