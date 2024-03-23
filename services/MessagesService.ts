import { Inject, Service } from 'typedi';
import {
    IMessagesRepository,
    MessagesRepository,
} from '../repositories/MessagesRepo';
import { IMessage, IMessageDocument } from '../models/MessageModel';
import { ITask, ITaskDocument } from '../models/TaskModel';
import { ITasksRepository, TasksRepository } from '../repositories/TasksRepo';
import {
    CannotCreateMessageError,
    CannotJoinRoomError,
} from '../errors/MessagesError';
import { MongooseError, Types } from 'mongoose';

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
    getMessageHistory: (
        taskId: string,
        page: number,
        limit: number,
    ) => Promise<IMessage[]>;
    isJoinableIdRoom: (taskId: string, userId: string) => Promise<void>;
}

@Service()
export class MessagesService implements IMessagesService {
    private messagesRepository: IMessagesRepository;
    private tasksRepository: ITasksRepository;

    constructor(
        @Inject(() => MessagesRepository)
        messagesRepository: IMessagesRepository,
        @Inject(() => TasksRepository)
        tasksRepository: ITasksRepository,
    ) {
        this.messagesRepository = messagesRepository;
        this.tasksRepository = tasksRepository;
    }

    isJoinableIdRoom = async (
        taskId: string,
        userId: string,
    ): Promise<void> => {
        // try {
        //     const task: ITaskDocument | null =
        //         await this.tasksRepository.findOne(taskId);
        //     if (!task || !['In Progress' || 'Closed'].includes(task.status)) {
        //         throw new CannotJoinRoomError('Invalid task id');
        //     }
        //     const isUserHired = task.hiredWorkers.some(
        //         worker => worker.userId.toString() === userId,
        //     );
        //     if (!isUserHired) {
        //         throw new CannotJoinRoomError('You are not hired for this job');
        //     }
        // } catch (error) {
        //     if (error instanceof CannotJoinRoomError) {
        //         throw error;
        //     }
        //     if (error instanceof MongooseError) {
        //         throw new CannotJoinRoomError('Invalid task id');
        //     }
        //     throw new Error('Unknown error');
        // }
    };

    saveSystemMessage = async (
        taskId: string,
        text: { title?: string; content?: string },
    ): Promise<IMessage> => {
        try {
            const task: ITask | null =
                await this.tasksRepository.findOne(taskId);
            if (!task) {
                throw new CannotCreateMessageError('Invalid task id');
            }

            if (task.status !== 'In Progress') {
                throw new CannotCreateMessageError(
                    'Invalid task status, must be in progress',
                );
            }
            const newMessage: IMessageDocument =
                await this.messagesRepository.create({
                    taskId: new Types.ObjectId(taskId),
                    senderType: 'sys',
                    sentAt: new Date(),
                    text,
                } as IMessage);
            return newMessage;
        } catch (error) {
            throw error;
        }
    };

    saveUserMessage = async (
        taskId: string,
        senderId: string,
        text: string,
    ): Promise<IMessage> => {
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

            // const isUserHired = task.hiredWorkers.some(
            //     worker =>
            //         worker.userId.toString() === senderId &&
            //         worker.status === 'In Progress',
            // );

            // if (!isUserHired) {
            //     throw new CannotCreateMessageError(
            //         'You are not hired for this job or your status is not in progress',
            //     );
            // }

            const newMessage = await this.messagesRepository.create({
                taskId: new Types.ObjectId(taskId),
                senderType: 'user',
                senderId: new Types.ObjectId(senderId),
                text: {
                    content: text,
                },
            });

            return newMessage;
        } catch (error) {
            throw error;
        }
    };

    getMessageHistory = async (
        taskId: string,
        page: number = 0,
        limit: number = 16,
    ): Promise<IMessage[]> => {
        const messages = await this.messagesRepository.findMessages({
            taskId,
            page,
            limit,
        });
        return messages;
    };
}
