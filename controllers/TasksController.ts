import { NextFunction, Request, Response } from 'express'
import TaskService from '../services/TasksService'
import { TaskValidationError } from '../exceptions/TasksError'

export const createTask = async (req: Request, res: Response) => {
    try {
        // Assuming that request body contains task data
        const taskData = req.body

        // Create a new task using the TaskService
        const newTask = await TaskService.postTask(taskData)

        // Respond with the created task
        res.status(201).json(newTask)
    } catch (error) {
        if (error instanceof TaskValidationError) {
            res.status(400).json({
                error: 'Invalid data',
                details: error.message,
            })
        } else {
            // Handle other types of errors
            res.status(500).json({ error: 'Internal server error' })
        }
    }
}
