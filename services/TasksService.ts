import { ITaskDocument } from '../models/TaskModel'
import { TasksRepository } from '../repositories/TasksRepo'
import { Inject, Service } from 'typedi'

@Service()
class TaskService {
    private tasksRepository: TasksRepository

    constructor(@Inject() taskRepository: TasksRepository) {
        this.tasksRepository = taskRepository
    }
    async createTask(taskData: ITaskDocument): Promise<ITaskDocument> {
        try {
            const task: ITaskDocument = await this.tasksRepository.create(
                taskData,
            )
            return task
        } catch (error) {
            throw error
        }
    }
}

export default TaskService
