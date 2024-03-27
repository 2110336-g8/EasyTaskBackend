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
import { MongooseError, Types } from 'mongoose';
import dotenv from 'dotenv';
import UnreadCountRepository, {
    IUnreadCountRepository,
} from '../repositories/UnreadCountRepo';
import { ITasksService, TasksService } from './TasksService';

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
    increaseUnreadCount: (taskId: string, userIds: string[]) => Promise<void>;
    resetUnreadCount: (taskId: string, userId: string) => Promise<void>;
    getUnreadCount: (userId: string) => Promise<Map<string, number>>;
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
    getUsersOfRoom: (taskId: string) => Promise<Set<string>>;
}

@Service()
export class MessagesService implements IMessagesService {
    constructor(
        @Inject(() => MessagesRepository)
        private messagesRepository: IMessagesRepository,
        @Inject(() => TasksService)
        private tasksService: ITasksService,
        @Inject(() => UnreadCountRepository)
        private unreadCountRepository: IUnreadCountRepository,
    ) {}

    async getUnreadCount(userId: string): Promise<Map<string, number>> {
        const unreadDoc =
            await this.unreadCountRepository.getUnreadCountByUserId(userId);
        const mapper = new Map<string, number>();
        unreadDoc.forEach(value =>
            mapper.set(value.taskId.toString(), value.count),
        );

        return mapper;
    }

    async getUsersOfRoom(taskId: string): Promise<Set<string>> {
        try {
            const task = await this.tasksService.getTaskById(taskId);
            if (!task) {
                throw new Error('Invalid task id');
            }
            const users = new Set<string>();
            users.add(task.customerId.toString());
            task.hiredWorkers.forEach(hiredWorker =>
                users.add(hiredWorker.userId.toString()),
            );
            return users;
        } catch (err) {
            throw err;
        }
    }

    async isJoinableIdRoom(taskId: string, userId: string): Promise<void> {
        try {
            const task = await this.tasksService.getTaskById(taskId);
            if (
                !task ||
                !['InProgress', 'Dissmissed', 'Completed'].includes(task.status)
            ) {
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
            const task = await this.tasksService.getTaskById(taskId);
            if (!task) {
                throw new CannotCreateMessageError('Invalid task id');
            }
            if (task.status !== 'InProgress') {
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
            const task = await this.tasksService.getTaskById(taskId);
            if (!task) {
                throw new CannotCreateMessageError('Invalid task id');
            }
            if (task.status !== 'InProgress') {
                throw new CannotCreateMessageError(
                    'Invalid task status, must be in progress',
                );
            }
            const isUserHired = task.hiredWorkers.some(worker => {
                console.log(worker);
                console.log(senderId);
                return (
                    worker.userId.toString() === senderId.toString() &&
                    [
                        'InProgress',
                        'Submitted',
                        'Revising',
                        'Resubmitted',
                    ].includes(worker.status)
                );
            });
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

    async increaseUnreadCount(taskId: string, userIds: string[]) {
        await this.unreadCountRepository.incrementUnread(taskId, userIds);
    }

    async resetUnreadCount(taskId: string, userId: string) {
        await this.unreadCountRepository.resetUnread(taskId, userId);
    }

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
            status === 'active' ? ['InProgress'] : ['Completed', 'Canceled'];
        let tasks: ITaskDocument[] =
            await this.tasksService.getTasksByUserIdAndStatus(
                userId,
                taskStatus,
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
