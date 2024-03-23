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

export interface SendMessageDTO {
    taskId: string;
    senderId: string;
    text: string;
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
    private messagesService: IMessagesService;
    private tasksService: ITasksService;
    private usersService: IUsersService;
    private imagesService: ImageService;

    constructor(
        @Inject(() => MessagesService) messagesService: IMessagesService,
        @Inject(() => TasksService) tasksService: ITasksService,
        @Inject(() => UsersService) usersService: IUsersService,
        @Inject(() => ImageService) imagesService: ImageService,
    ) {
        this.messagesService = messagesService;
        this.tasksService = tasksService;
        this.usersService = usersService;
        this.imagesService = imagesService;
    }

    respond = async (io: Server, socket: Socket) => {
        socket.on('join_room', async (taskId: string) => {
            try {
                const userId = socket.data.user._id;
                await this.messagesService.isJoinableIdRoom(taskId, userId);
                socket.join(taskId);
                socket.emit('join_success', 'Room joined successfully');
                console.log(`User ${userId} joined room ${taskId}`);
            } catch (error) {
                if (error instanceof CannotJoinRoomError) {
                    socket.emit('join_error', error.message);
                } else {
                    socket.emit('join_error', 'Internal Server Error');
                }
            }
        });

        socket.on('send_message', async (data: SendMessageDTO) => {
            try {
                console.log(data);
                const taskId = data.taskId;
                const senderId = data.senderId;
                const text = data.text;
                const message = await this.messagesService.saveUserMessage(
                    taskId,
                    senderId,
                    text,
                );
                console.log(message);
                io.of('/chats').to(data.taskId).emit('chat_message', message);
            } catch (error) {
                console.log(error);
            }
        });
    };

    getMessageRoomInfo = async (req: Request, res: Response) => {
        try {
            const taskId = req.params.id;
            const task = await this.tasksService.getTaskById(taskId);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    error: 'Task Not Found',
                });
            }
            const taskTitle = task.title;

            const customer_id = task.customerId;
            const customer = await this.usersService.getUserById(
                customer_id.toString(),
            );
            if (!customer) {
                return res.status(404).json({
                    error: 'Customer Not Found',
                });
            }
            let customer_imageUrl = '';
            if (customer.imageKey) {
                customer_imageUrl =
                    (await this.imagesService.getImageByKey(
                        customer.imageKey,
                    )) ?? '';
            }

            const workers_id = task.hiredWorkers.map(worker => {
                return worker.userId;
            });
            const workers = [];
            for (let worker_id of workers_id) {
                const worker = await this.usersService.getUserById(
                    worker_id.toString(),
                );
                if (!worker) {
                    return res.status(404).json({
                        error: 'Worker Not Found',
                    });
                }
                let worker_imageUrl = '';
                if (worker.imageKey) {
                    worker_imageUrl =
                        (await this.imagesService.getImageByKey(
                            worker.imageKey,
                        )) ?? '';
                }
                workers.push({
                    _id: worker._id,
                    name: worker.firstName,
                    imageUrl: worker_imageUrl,
                });
            }

            res.status(200).json({
                success: true,
                info: {
                    taskId,
                    taskTitle,
                    customer: {
                        _id: customer._id,
                        name: customer.firstName,
                        imageUrl: customer_imageUrl,
                    },
                    hiredWorkers: workers,
                },
            });
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
