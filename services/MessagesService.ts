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
import { MongooseError, Types } from 'mongoose';
import UnreadCountRepository, {
    IUnreadCountRepository,
} from '../repositories/UnreadCountRepo';
import { ITasksService, TasksService } from './TasksService';
import { Server } from 'socket.io';
export interface IMessagesService {
    joinSocketRoom: (socketId: string, taskId: string, userId: string) => void;
    leaveSocketRoom: (socketId: string) => void;
    getUsersInSocketRoom: (taskId: string) => Set<string>;
    sendUserMessage: (
        io: Server,
        taskId: string,
        senderId: string,
        text: string,
    ) => Promise<IMessage>;
    sendSystemMessage: (
        io: Server,
        taskId: string,
        text: {
            title?: string;
            content?: string;
        },
    ) => Promise<IMessage>;
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
    isJoinableRoom: (taskId: string, userId: string) => Promise<void>;
}

@Service()
export class MessagesService implements IMessagesService {
    private activeSocket: Map<string, { userId: string; taskId: string }> =
        new Map();
    private activeUsers: Map<string, Set<string>> = new Map();

    constructor(
        @Inject(() => MessagesRepository)
        private messagesRepository: IMessagesRepository,
        @Inject(() => TasksService)
        private tasksService: ITasksService,
        @Inject(() => UnreadCountRepository)
        private unreadCountRepository: IUnreadCountRepository,
    ) {}

    joinSocketRoom(socketId: string, taskId: string, userId: string): void {
        this.activeSocket.set(socketId, { userId, taskId });
        if (!this.activeUsers.get(taskId)) {
            this.activeUsers.set(taskId, new Set());
        }
        this.activeUsers.get(taskId)?.add(userId);
        this.resetUnreadCount(taskId, userId);
    }

    leaveSocketRoom(socketId: string): void {
        const socket = this.activeSocket.get(socketId);
        if (!!socket) {
            this.activeUsers.get(socket.taskId)?.delete(socket.userId);
        }
        this.activeSocket.delete(socketId);
    }

    getUsersInSocketRoom(taskId: string): Set<string> {
        return this.activeUsers.get(taskId) ?? new Set();
    }

    async getUnreadCount(userId: string): Promise<Map<string, number>> {
        const unreadDoc =
            await this.unreadCountRepository.getUnreadCountByUserId(userId);
        const mapper = new Map<string, number>();
        unreadDoc.forEach(value =>
            mapper.set(value.taskId.toString(), value.count),
        );

        return mapper;
    }

    async isJoinableRoom(taskId: string, userId: string): Promise<void> {
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

    async sendUserMessage(
        io: Server,
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
            this.increaseUnreadCount(taskId);
            io.of('/messages').to(taskId).emit('chat_message', newMessage);
            return newMessage;
        } catch (error) {
            throw error;
        }
    }

    async sendSystemMessage(
        io: Server,
        taskId: string,
        text: {
            title?: string;
            content?: string;
        },
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
                text: { title: text.title, content: text.content },
            } as IMessage);
            this.increaseUnreadCount(taskId);
            io.of('/messages').to(taskId).emit('chat_message', newMessage);
            return newMessage;
        } catch (error) {
            throw error;
        }
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

    private async increaseUnreadCount(taskId: string) {
        const users = await this.getUsersOfRoom(taskId);
        const inRoom = this.getUsersInSocketRoom(taskId);
        inRoom.forEach(user => users.delete(user));
        await this.unreadCountRepository.incrementUnread(
            taskId,
            Array.from(users),
        );
    }
    private async resetUnreadCount(taskId: string, userId: string) {
        await this.unreadCountRepository.resetUnread(taskId, userId);
    }
    private async getUsersOfRoom(taskId: string): Promise<Set<string>> {
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
}
