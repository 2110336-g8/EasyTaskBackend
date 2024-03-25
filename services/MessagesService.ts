import { Inject, Service } from 'typedi';
import {
    CannotCreateMessageError,
    CannotJoinRoomError,
} from '../errors/MessagesError';
import { IMessage, IMessageDocument } from '../models/MessageModel';
import { ITask, ITaskDocument } from '../models/TaskModel';
import {
    IMessagesRepository,
    MessagesRepository,
} from '../repositories/MessagesRepo';
import { ITasksRepository, TasksRepository } from '../repositories/TasksRepo';
import { ImageService } from './ImageService';
import { MongooseError, Types } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './config/config.env' });
const IMAGE_EXPIRE_TIME_SECONDS = Number(process.env.IMAGE_EXPIRE_TIME);

export interface IMessagesService {
    saveUserMessage: (
        taskId: string,
        senderId: string,
        text: string,
    ) => Promise<IMessage>;
    saveSystemMessage: (
        taskId: string,
        text: { title?: string; content?: string },
    ) => Promise<IMessage>;
    // increaseUnreadCount: (taskId: string, userIds: string[]) => Promise<void>;
    // resetUnreadCount: (taskId: string, userIds: string[]) => Promise<void>;
    getMessageHistory: (
        taskId: string,
        page: number,
        limit: number,
    ) => Promise<IMessage[]>;
    getMessageRooms: (
        userId: string,
        status: 'active' | 'archived',
    ) => Promise<
        { message: IMessageDocument; task: ITaskDocument | undefined }[]
    >;
    isJoinableIdRoom: (taskId: string, userId: string) => Promise<void>;
}

@Service()
export class MessagesService implements IMessagesService {
    constructor(
        @Inject(() => MessagesRepository)
        private messagesRepository: IMessagesRepository,
        @Inject(() => TasksRepository)
        private tasksRepository: ITasksRepository,
        @Inject(() => ImageService) private imageService: ImageService,
        // @Inject(() => UnreadCounterRepository)
        // private unreadCounterRepository: IUnreadCounterRepository,
    ) {}

    async isJoinableIdRoom(taskId: string, userId: string): Promise<void> {
        try {
            const task = await this.tasksRepository.findOne(taskId);
            if (!task || !['In Progress' || 'Closed'].includes(task.status)) {
                throw new CannotJoinRoomError('Invalid task id');
            }
            const isUserHired = task.hiredWorkers.some(
                worker => worker.userId.toString() === userId.toString(),
            );
            if (
                !isUserHired &&
                task.customerId.toString() !== userId.toString()
            ) {
                throw new CannotJoinRoomError(
                    'You do not have permission to join this room',
                );
            }
        } catch (error) {
            if (error instanceof CannotJoinRoomError) {
                throw error;
            }
            if (error instanceof MongooseError) {
                throw new CannotJoinRoomError('Invalid task id');
            }
            throw new Error('Unknown error');
        }
    }

    async saveSystemMessage(
        taskId: string,
        text: { title?: string; content?: string },
    ): Promise<IMessage> {
        try {
            const task = await this.tasksRepository.findOne(taskId);
            if (!task) {
                throw new CannotCreateMessageError('Invalid task id');
            }
            if (task.status !== 'In Progress') {
                throw new CannotCreateMessageError(
                    'Invalid task status, must be in progress',
                );
            }
            const newMessage = await this.messagesRepository.create({
                taskId: new Types.ObjectId(taskId),
                senderType: 'sys',
                text,
            } as IMessage);
            return newMessage;
        } catch (error) {
            throw error;
        }
    }

    async saveUserMessage(
        taskId: string,
        senderId: string,
        text: string,
    ): Promise<IMessage> {
        try {
            const task = await this.tasksRepository.findOne(taskId);
            if (!task) {
                throw new CannotCreateMessageError('Invalid task id');
            }
            if (task.status !== 'In Progress') {
                throw new CannotCreateMessageError(
                    'Invalid task status, must be in progress',
                );
            }
            const isUserHired = task.hiredWorkers.some(
                worker =>
                    worker.userId.toString() === senderId.toString() &&
                    worker.status === 'In Progress',
            );
            if (
                !isUserHired &&
                task.customerId.toString() !== senderId.toString()
            ) {
                throw new CannotCreateMessageError(
                    'You do not have permission to send messages to this room',
                );
            }
            const newMessage = await this.messagesRepository.create({
                taskId: new Types.ObjectId(taskId),
                senderType: 'user',
                senderId: new Types.ObjectId(senderId),
                text: { content: text },
            } as IMessage);
            return newMessage;
        } catch (error) {
            throw error;
        }
    }

    // async increaseUnreadCount(taskId: string, userIds: string[]) {
    //     await this.unreadCounterRepository.incrementUnread(taskId, userIds);
    // }

    // async resetUnreadCount(taskId: string, userIds: string[]) {
    //     await this.unreadCounterRepository.resetUnread(taskId, userIds);
    // }

    async getMessageHistory(
        taskId: string,
        page: number = 0,
        limit: number = 16,
    ): Promise<IMessage[]> {
        const messages = await this.messagesRepository.findMessages({
            taskId,
            page,
            limit,
        });
        return messages;
    }

    async getMessageRooms(
        userId: string,
        status: 'active' | 'archived',
    ): Promise<
        { message: IMessageDocument; task: ITaskDocument | undefined }[]
    > {
        const taskStatus: string[] =
            status === 'active' ? ['In Progress'] : ['Completed', 'Canceled'];
        let tasks: ITaskDocument[] =
            await this.tasksRepository.findTasksByUserIdAndStatus(
                userId,
                taskStatus,
            );

        tasks = await Promise.all(
            tasks.map(async task => {
                let imageUrl = task.imageUrl;
                const imageUrlLastUpdateTime = task.imageUrlLastUpdateTime;
                if (
                    !imageUrlLastUpdateTime ||
                    Date.now() >
                        imageUrlLastUpdateTime.getTime() +
                            IMAGE_EXPIRE_TIME_SECONDS * 1000
                ) {
                    const imageKey = task.imageKey;
                    if (imageKey) {
                        const fetchedImageUrl =
                            await this.imageService.getImageByKey(imageKey);
                        if (fetchedImageUrl) {
                            imageUrl = fetchedImageUrl;
                            task.imageUrl = fetchedImageUrl;
                            task.imageUrlLastUpdateTime = new Date();
                            await this.tasksRepository.update(task._id, {
                                imageUrl: fetchedImageUrl,
                                imageUrlLastUpdateTime: new Date(),
                            } as ITaskDocument);
                        }
                    }
                }
                return task;
            }),
        );

        const taskIds: string[] = tasks.map(t => t._id);
        const messages =
            await this.messagesRepository.findLatestMessageEachTask(taskIds);

        const taskWithMessages = messages.map(message => {
            const task = tasks.find(
                t => t._id.toString() === message.taskId.toString(),
            );
            return { message, task };
        });

        return taskWithMessages;
    }
}
