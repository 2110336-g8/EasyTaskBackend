import { ITask, ITaskDocument } from '../models/TaskModel';
import { ITaskRepository, TasksRepository } from '../repositories/TasksRepo';
import { Inject, Service } from 'typedi';
import { ValidationError } from '../errors/RepoError';

export interface ITasksService {
    createTask: (taskData: ITask) => Promise<ITaskDocument>;
    getTaskList: (taskPage: number, taskPerPage: number) => Promise<ITaskDocument[]>;
    getTaskById: (id: string) => Promise<ITaskDocument | null>;
    updateTask: (
        id: string,
        updateData: Partial<ITask>,
    ) => Promise<ITaskDocument | null>;
}

@Service()
export class TasksService implements ITasksService {
    private taskRepository: ITaskRepository;

    constructor(
        @Inject(() => TasksRepository)
        taskRepository: ITaskRepository,
    ) {
        this.taskRepository = taskRepository;
    }

    async createTask(taskData: ITask): Promise<ITaskDocument> {
        try {
            const task: ITaskDocument =
                await this.taskRepository.create(taskData);
            return task;
        } catch (error) {
            if (error instanceof ValidationError) throw error;
            else {
                throw new Error('Unknown Error');
            }
        }
    }

    async getTaskList(page: number, taskPerPage: number): Promise<ITaskDocument[]> {
        try {
            const tasks: ITaskDocument[] = await this.taskRepository.findTaskByPage(page, taskPerPage);
            return tasks;
        } catch (error) {
            throw error;
        }
    }

    async getTaskById(id: string): Promise<ITaskDocument | null> {
        try {
            const task = await this.taskRepository.findOne(id);
            return task;
        } catch (error) {
            return null;
        }
    }

    async updateTask(
        id: string,
        updateData: Partial<ITask>,
    ): Promise<ITaskDocument | null> {
        try {
            // Ensure that the required properties are not undefined
            if (updateData.title === undefined || updateData) {
                throw new Error('Title is required for task update');
            }

            const updatedTask = await this.taskRepository.update(
                id,
                updateData,
            );
            return updatedTask;
        } catch (error) {
            console.error(error);
            return null;
        }
    }
}
