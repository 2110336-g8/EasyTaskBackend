import { Inject, Service } from 'typedi';
import { IMessagesService, MessagesService } from '../services/MessagesService';
import { Request, Response } from 'express';
import { ValidationError } from '../errors/RepoError';
import { CannotCreateMessageError } from '../errors/MessagesError';

@Service()
export class MessagesController {
    private messagesService: IMessagesService;

    constructor(
        @Inject(() => MessagesService) messagesService: IMessagesService,
    ) {
        this.messagesService = messagesService;
    }

    // Development
    sendUserMessage = async (req: Request, res: Response) => {
        try {
            const taskId = req.params.id;
            const senderId = req.user.id;
            const text = req.body.text;
            const message = await this.messagesService.sendUserMessage(
                taskId,
                senderId,
                text,
            );
            res.status(200).json({ success: true, message });
        } catch (error) {
            this.handleError(res, error);
        }
    };

    getMessageHistory = async (req: Request, res: Response) => {
        try {
            const taskId = req.params.id;
            const page = parseInt(req.query.page as string, 10) || 0;
            const limit = parseInt(req.query.limit as string, 10) || 25;
            const messages = await this.messagesService.getMessageHistory(
                taskId,
                page,
                limit,
            );
            res.status(200).json({
                success: true,
                messages,
            });
        } catch (error) {
            this.handleError(res, error);
        }
    };

    private handleError = (res: Response, error: any) => {
        if (error instanceof CannotCreateMessageError) {
            res.status(400).json({
                error: error.message,
            });
        } else {
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    };
}
