import { Inject, Service } from 'typedi';
import {
    IMessagesRepository,
    MessagesRepository,
} from '../repositories/MessagesRepo';
import { IMessage, IMessageDocument } from '../models/MessageModel';
import { ITask } from '../models/TaskModel';
import { ITasksRepository, TasksRepository } from '../repositories/TasksRepo';
import { CannotCreateMessageError } from '../errors/MessagesError';
import { Types } from 'mongoose';

export interface IMessagesService {
    sendUserMessage: (
        taskId: string,
        senderId: string,
        text: string,
    ) => Promise<IMessage>;
    sendSystemMessage: (
        taskId: string,
        text: { title?: string; content?: string },
    ) => Promise<IMessage>;
    getMessageHistory: (
        taskId: string,
        page: number,
        limit: number,
    ) => Promise<IMessage[]>;
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

    sendSystemMessage = async (
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

    sendUserMessage = async (
        taskId: string,
        senderId: string,
        text: string,
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
        const messages = await this.messagesRepository._model
            .find({ taskId })
            .sort({ createdAt: -1 }) // Sorting in descending order of createdAt
            .skip(page * limit) // Skipping documents based on page number and limit
            .limit(limit); // Limiting the number of documents returned per page

        return messages;
    };
}
