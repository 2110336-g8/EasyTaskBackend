import { ITask, ITaskDocument } from '../models/TaskModel';
import { ITasksRepository, TasksRepository } from '../repositories/TasksRepo';
import { IUsersRepositorty, UsersRepository } from '../repositories/UsersRepo';
import { Inject, Service } from 'typedi';
import { NotFoundError, ValidationError } from '../errors/RepoError';
import categoryData from '../assets/categories/categorieslist.json';
import { ICategory } from '../models/CategoryModel';

export interface ITasksService {
    createTask: (taskData: ITask, email: string) => Promise<ITaskDocument>;
    getTaskList: (
        taskPage: number,
        taskPerPage: number,
    ) => Promise<ITaskDocument[]>;
    getTaskById: (id: string) => Promise<ITaskDocument | null>;
    updateTask: (
        id: string,
        updateData: ITask,
    ) => Promise<ITaskDocument | null>;
    countTasks: () => Promise<number | null>;
    getCategories: () => Promise<ICategory[]>;
}

@Service()
export class TasksService implements ITasksService {
    private taskRepository: ITasksRepository;
    private userRepository: IUsersRepositorty;

    constructor(
        @Inject(() => TasksRepository)
        taskRepository: ITasksRepository,
        @Inject(() => UsersRepository)
        userRepository: IUsersRepositorty,
    ) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    createTask = async (
        taskData: ITask,
        email: string,
    ): Promise<ITaskDocument> => {
        try {
            const existEmailUser =
                await this.userRepository.findOneByEmail(email);
            if (!existEmailUser) {
                throw new NotFoundError('User not found');
            }
            taskData.customerId = existEmailUser._id;
            const task: ITaskDocument =
                await this.taskRepository.create(taskData);
            return task;
        } catch (error) {
            if (
                error instanceof ValidationError ||
                error instanceof NotFoundError
            )
                throw error;
            else {
                throw new Error('Unknown Error');
            }
        }
    };

    getTaskList = async (
        page: number,
        taskPerPage: number,
    ): Promise<ITaskDocument[]> => {
        try {
            const taskList: ITaskDocument[] =
                await this.taskRepository.findTasksByPage(page, taskPerPage);
            return taskList;
        } catch (error) {
            return [];
        }
    };

    async countTasks(): Promise<number | null> {
        try {
            const count = await this.taskRepository.countAllTasks();
            return count;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    getTaskById = async (id: string): Promise<ITaskDocument | null> => {
        try {
            const task = await this.taskRepository.findOne(id);
            return task;
        } catch (error) {
            return null;
        }
    };

    updateTask = async (
        id: string,
        updateData: ITask,
    ): Promise<ITaskDocument | null> => {
        try {
            if (updateData) {
                const updatedTask = await this.taskRepository.update(
                    id,
                    updateData,
                );
                return updatedTask;
            } else {
                return null;
            }
        } catch (error) {
            console.error(error);
            return null;
        }
    };

    getCategories = async (): Promise<ICategory[]> => {
        try {
            const categories: ICategory[] = await Promise.all(
                categoryData.categories.map(async category => {
                    try {
                        return {
                            id: category.id,
                            name: category.name,
                        };
                    } catch (error) {
                        throw error;
                    }
                }),
            );
            return categories;
        } catch (error) {
            return [];
        }
    };
}
