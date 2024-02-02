import { Request, Response } from 'express';
import { ValidationError } from '../errors/RepoError';
import { Service, Inject } from 'typedi';
import TasksService, { ITasksService } from '../services/TasksService';

@Service()
class TasksController {
    private tasksService: ITasksService;

    constructor(@Inject(() => TasksService) tasksService: ITasksService) {
        this.tasksService = tasksService;
    }

    createTask = async (req: Request, res: Response): Promise<void> => {
        try {
            const data = req.body;
            const task = await this.tasksService.createTask(data);
            res.status(201).json({
                success: true,
                task,
            });
        } catch (error) {
            if (error instanceof ValidationError) {
                res.status(400).json({
                    error: error.name,
                    detalis: error.message,
                });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    };
}

export default TasksController;
