import e, { Request, Response } from 'express';
import { ValidationError } from '../errors/RepoError';
import { Service, Inject } from 'typedi';
import { TasksService, ITasksService } from '../services/TasksService';
import { ImageService } from '../services/ImageService';
import sharp from 'sharp';
import { parse } from 'dotenv';
@Service()
class TasksController {
    private tasksService: ITasksService;
    private imageService: ImageService;

    constructor(
        @Inject(() => TasksService) tasksService: ITasksService,
        @Inject(() => ImageService) imageService: ImageService,
    ) {
        this.tasksService = tasksService;
        this.imageService = imageService;
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
                    details: error.message,
                });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    };

    getTasks = async (req:Request, res:Response) => {
        try {
            const taskPage = parseInt(req.params.page) || 1;
            const taskPerPage = parseInt(req.query.size as string) || 8;

            const tasks = await this.tasksService.getTaskList(taskPage, taskPerPage);
            res.status(200).json({
                success: true,
                currentPage: taskPage,
                size: taskPerPage,
                tasks,
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
}

export default TasksController;