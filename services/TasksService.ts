import { Error as MongooseError } from 'mongoose'
import { TaskModel, ITask, ITaskDocument } from '../models/TaskModel'
import { TaskValidationError } from '../exceptions/TasksError'
import { MongoError, MongoServerError } from 'mongodb'

class TaskService {
    static async createTask(
        taskData: Omit<ITask, '_id'>,
    ): Promise<ITaskDocument> {
        try {
            const newTask: ITaskDocument = await TaskModel.create(taskData)
            return newTask
        } catch (error) {
            if (error instanceof MongooseError.ValidationError) {
                throw new TaskValidationError(error.message)
            } else if ((error as MongoServerError).code == 11000) {
                throw new TaskValidationError(
                    (error as MongoServerError).message,
                )
            } else if (error instanceof TaskValidationError) {
                throw new TaskValidationError(error.message)
            } else {
                throw new Error('Unknown Error')
            }
        }
    }
}

export default TaskService
