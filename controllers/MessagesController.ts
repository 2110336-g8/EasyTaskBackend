import { Inject, Service } from 'typedi';
import { IMessagesService, MessagesService } from '../services/MessagesService';
import { Request, Response } from 'express';
import {
    CannotCreateMessageError,
    CannotJoinRoomError,
} from '../errors/MessagesError';
import { Server, Socket } from 'socket.io';
import { ITasksService, TasksService } from '../services/TasksService';
import { IUsersService, UsersService } from '../services/UsersService';
import { ImageService } from '../services/ImageService';
import { IMessage, IMessageDocument } from '../models/MessageModel';
export interface SendMessageDTO {
    taskId: string;
    senderId: string;
    text: string;
}

export interface MessageRoomPreview {
    _id: string;
    taskTitle: string;
    imageUrl?: string;
    latestMessage?: MessagePreview;
    unreadCount: number;
}

export interface MessagePreview {
    senderName: string;
    message: string;
    sentAt: Date;
}
export interface MessagesRoomList {
    active: MessageRoomPreview[];
    archived: MessageRoomPreview[];
}

export interface MessageRoomInfo {
    taskId: string;
    taskTitle: string;
    client: {
        _id: string;
        name: string;
        imageUrl: string;
    };
    hiredWorkers: {
        _id: string;
        name: string;
        imageUrl: string;
    }[];
}

@Service()
export class MessagesController {
    constructor(
        @Inject(() => MessagesService)
        private messagesService: IMessagesService,
        @Inject(() => TasksService) private tasksService: ITasksService,
        @Inject(() => UsersService) private usersService: IUsersService,
        @Inject(() => ImageService) private imagesService: ImageService,
    ) {}

    respond = async (io: Server, socket: Socket) => {
        socket.on('join_room', this.handleJoinRoom(socket));
        socket.on('send_message', this.handleSendMessage(io));
    };

    private handleJoinRoom = (socket: Socket) => async (taskId: string) => {
        try {
            const userId = socket.data.user._id;
            await this.messagesService.isJoinableIdRoom(taskId, userId);
            socket.join(taskId);
            // await this.messagesService.resetUnreadCount(taskId, [userId]);
            socket.emit('join_success', 'Room joined successfully');
            console.log(`User ${userId} joined room ${taskId}`);
        } catch (error) {
            this.handleJoinError(socket, error);
        }
    };

    private handleJoinError = (socket: Socket, error: any) => {
        if (error instanceof CannotJoinRoomError) {
            socket.emit('join_error', error.message);
        } else {
            socket.emit('join_error', 'Internal Server Error');
        }
    };

    private handleSendMessage =
        (io: Server) => async (data: SendMessageDTO) => {
            try {
                const taskId = data.taskId;
                const senderId = data.senderId;
                const text = data.text;
                const message = await this.messagesService.saveUserMessage(
                    taskId,
                    senderId,
                    text,
                );
                console.log(
                    `user ${senderId} sent \"${text}\" to room ${taskId}`,
                );
                console.log(io.sockets.in(taskId));
                io.of('/messages').to(taskId).emit('chat_message', message);
            } catch (error) {
                console.log(error);
            }
        };

    getMessageRoomsList = async (req: Request, res: Response) => {
        try {
            const userId = req.user._id;

            const activeMessageTask =
                await this.messagesService.getMessageRooms(userId, 'active');
            const archivedMessageTask =
                await this.messagesService.getMessageRooms(userId, 'archived');

            const activeRooms = await Promise.all(
                activeMessageTask.map(this.mapMessageRoomPreview),
            );
            const archivedRooms = await Promise.all(
                archivedMessageTask.map(this.mapMessageRoomPreview),
            );

            res.status(200).json({
                success: true,
                messagesRooms: { activeRooms, archivedRooms },
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    private mapMessageRoomPreview = async (e: any) => {
        const latestMessage = await this.getMessagePreview(e.message);
        return {
            _id: e.message.taskId.toString(),
            taskTitle: e.task?.title ?? '',
            imageUrl: e.task?.imageUrl,
            latestMessage,
            unreadCount: 0,
        };
    };

    private getMessagePreview = async (
        m: IMessageDocument,
    ): Promise<MessagePreview> => {
        const senderName = await this.getSenderName(
            m.senderId?.toString(),
            m.senderType,
        );
        const message = this.getMessageContent(m.senderType, m.text);
        return {
            senderName,
            message,
            sentAt: m.sentAt,
        };
    };

    private getSenderName = async (
        senderId: string | undefined,
        senderType: string,
    ): Promise<string> => {
        if (senderType === 'sys') {
            return 'System';
        } else {
            if (!senderId) {
                return 'Unknown sender';
            }
            const sender = await this.usersService.getUserById(
                senderId.toString(),
            );
            return sender?.firstName ?? 'Unknown sender';
        }
    };

    private getMessageContent = (
        senderType: string,
        text: { title?: string; content?: string },
    ): string => {
        if (senderType === 'sys') {
            return `${text.title ?? ''} ${text.content ?? ''}`;
        } else {
            return text.content ?? '';
        }
    };

    getMessageRoomInfo = async (req: Request, res: Response) => {
        try {
            const taskId = req.params.id;
            const task = await this.tasksService.getTaskById(taskId);
            if (!task) {
                return res
                    .status(404)
                    .json({ success: false, error: 'Task Not Found' });
            }
            const taskTitle = task.title;

            const customer = await this.getUserInfo(task.customerId.toString());
            if (!customer) {
                return res.status(404).json({ error: 'Customer Not Found' });
            }

            const workers = await Promise.all(
                task.hiredWorkers.map(worker =>
                    this.getUserInfo(worker.userId.toString()),
                ),
            );

            res.status(200).json({
                success: true,
                info: { taskId, taskTitle, customer, hiredWorkers: workers },
            });
        } catch (error) {
            this.handleError(res, error);
        }
    };

    private getUserInfo = async (userId: string) => {
        const user = await this.usersService.getUserById(userId.toString());
        if (!user) return null;
        const imageUrl = user.imageKey
            ? await this.imagesService.getImageByKey(user.imageKey)
            : undefined;
        return {
            _id: user._id,
            name: user.firstName,
            imageUrl,
        };
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
            res.status(200).json({ success: true, messages });
        } catch (error) {
            this.handleError(res, error);
        }
    };

    private handleError = (res: Response, error: any) => {
        if (error instanceof CannotCreateMessageError) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}
