import { Request, Response } from 'express'
import { UsersService as UsersService } from '../services/UsersService'
import { NotFoundError, ValidationError } from '../errors/RepoError'
import { Service, Inject } from 'typedi'
import TasksService from '../services/TasksService'

@Service()
class TasksController {
    private tasksService: TasksService

    constructor(@Inject() tasksService: TasksService) {
        this.tasksService = tasksService
    }

    createTask = async (req: Request, res: Response): Promise<void> => {
        try {
            const data = req.body
            const task = await this.tasksService.createTask(data)
            res.status(201).json(task)
        } catch (error) {
            if (error instanceof ValidationError) {
                res.status(400).json({
                    error: error.name,
                    detalis: error.message,
                })
            } else {
                res.status(500).json({ error: 'Internal Server Error' })
            }
        }
    }
}
