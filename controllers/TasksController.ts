import e, { Request, Response } from 'express';
import { ValidationError } from '../errors/RepoError';
import { Service, Inject } from 'typedi';
import { TasksService, ITasksService } from '../services/TasksService';
import { ImageService } from '../services/ImageService';
import sharp from 'sharp';
import {
    CannotApplyTaskError,
    CannotCancelTaskError,
} from '../errors/TaskError';
import { ITaskDocument } from '../models/TaskModel';
import dotenv from 'dotenv';
dotenv.config({ path: './config/config.env' });

@Service()
class TasksController {
    private tasksService: ITasksService;
    private imageService: ImageService;
    usersService: any;

    constructor(
        @Inject(() => TasksService) tasksService: ITasksService,
        @Inject(() => ImageService) imageService: ImageService,
    ) {
        this.tasksService = tasksService;
        this.imageService = imageService;
    }

    createTask = async (req: Request, res: Response): Promise<void> => {
        try {
            var data = req.body;
            data.customerId = req.user._id;
            var data = req.body;
            data.customerId = req.user._id;
            const task = await this.tasksService.createTask(data);
            res.status(201).json({ task: task.toJSON() });
        } catch (error) {
            if (error instanceof ValidationError) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Internal Server Error',
                });
            }
        }
    };

    getTasksPage = async (req: Request, res: Response) => {
        console.log(req.user);
        try {
            const data = req.body;

            const taskPage = Number(data.page) || 1;
            const taskPerPage = Number(data.limit) || 8;

            // search tasks'title and tasks' location
            let filter: any = {};

            // filter
            if (data.filter != null) {
                let workers_q: { $eq?: number; $gt?: number } = { $gt: 1 };
                if (data.filter.individual != null) {
                    if (data.filter.individual == true) {
                        workers_q = { $eq: 1 };
                    }
                    filter.workers = workers_q;
                }
                if (data.filter.category != null) {
                    filter.category = { $in: data.filter.category || [] };
                }

                if (data.filter.wages && Array.isArray(data.filter.wages)) {
                    let wage_filter = [];

                    for (let wage_range of data.filter.wages) {
                        let start = Number(wage_range[0]);
                        let end = Number(wage_range[1]);

                        let wageCondition: any = {};

                        if (start !== -1) {
                            wageCondition.$gte = start;
                        }
                        if (end !== -1) {
                            wageCondition.$lte = end;
                        }
                        wage_filter.push({ wages: wageCondition });
                    }

                    filter.$or = filter.$or || []; // Ensure $or is an array
                    filter.$or.push(...wage_filter);
                }
            }

            // Search name on tasks' title and tasks' location name
            if (data.name) {
                filter.$and = filter.$and || []; // Ensure $and is an array
                filter.$and.push({
                    $or: [
                        {
                            title: {
                                $regex: `.*${data.name}.*`,
                                $options: 'i',
                            },
                        },
                        {
                            'location.name': {
                                $regex: `.*${data.name}.*`,
                                $options: 'i',
                            },
                        },
                    ],
                });
            }

            const result = await this.tasksService.getTaskList(
                taskPage,
                taskPerPage,
                filter,
            );

            const { tasks, count } = result;

            res.status(200).json({
                success: true,
                page: taskPage,
                limit: taskPerPage,
                count: count,
                tasks,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    getTaskbyId = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const userId = req.user._id;
            const task = await this.tasksService.getTaskById(id);
            if (!task) {
                res.status(404).json({ error: 'Task not found' });
                return;
            }
            if (userId.toString() !== task.customerId.toString()) {
                const taskWithGeneralInfo =
                    await this.tasksService.getTaskWithGeneralInfoById(id);
                if (!taskWithGeneralInfo) {
                    res.status(404).json({
                        error: 'Task not found',
                    });
                    return;
                }
                res.status(200).json({
                    task: taskWithGeneralInfo,
                });
                return;
            }

            res.status(200).json({
                task,
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    getTaskExperience = async (req: Request, res: Response) => {
        try {
            const userId = req.params.id;
            if (userId != req.user._id) {
                res.status(403).json({
                    error: 'You are not authorized to view information',
                });
            }
            // const status = 'Completed';
            const status = req.query.status as string;
            // console.log(status);
            const task = await this.tasksService.getTaskExperience(
                userId,
                status,
            );
            res.status(200).json({ task: task });
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    getAdvertisements = async (req: Request, res: Response): Promise<void> => {
        try {
            const customerId = req.params.customerId;
            const status = req.query.status as string | undefined;

            const allowedStatusValues = [
                'Open',
                'In Progress',
                'Completed',
                'Closed',
            ];
            if (status && !allowedStatusValues.includes(status)) {
                res.status(400).json({ error: 'Invalid status parameter' });
                return;
            }

            const tasks = await this.tasksService.getAdvertisement(
                customerId,
                status || '',
            );
            res.status(200).json({ tasks });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    // image ---------------------------------------------------------------------------------
    getTaskImage = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = req.params.id;
            const task = await this.tasksService.getTaskById(id);
            if (!task) {
                res.status(404).json({ error: 'Task not found' });
                return;
            }
            const imageKey = task.imageKey;

            if (imageKey) {
                const imageUrl = await this.imageService.getImageByKey(
                    String(imageKey),
                );

                // If the image URL exists, redirect to the image
                if (imageUrl) {
                    res.status(200).json(imageUrl);
                } else {
                    res.status(404).json({ error: 'Task image not found' });
                }
            } else {
                res.status(404).json({ error: 'Task image not found' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    uploadTaskImage = async (req: Request, res: Response): Promise<void> => {
        try {
            const taskId = req.params.id;
            const file = req.body;
            // console.log(req.body);
            if (!file) {
                console.log('no file');
                res.status(400).json({ error: 'No file uploaded' });
                return;
            }
            // Use sharp to check if the file is an image
            try {
                const metadata = await sharp(file).metadata();

                // Extract the file extension from the originalname (e.g., '.jpg')
                const fileExtension = metadata.format!.toLowerCase();
                // console.log(fileExtension);

                // Generate the imageKey using the userId and fileExtension
                const key = `${taskId}.${fileExtension}`;
                // console.log(key);
                // Update the user's imageKey in your database
                await this.tasksService.updateTask(taskId, {
                    imageKey: key,
                } as ITaskDocument);

                // Upload the file to AWS S3 or your preferred storage
                const uploadedFile = await this.imageService.createImage(
                    file.buffer,
                    file.mimeType,
                    key,
                );

                res.status(201).json({
                    message: 'Task image uploaded successfully',
                });
            } catch (error) {
                res.status(400).json({
                    error: 'Uploaded file is not a valid image',
                });
                return;
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    deleteTaskImage = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = req.params.id;
            const task = await this.tasksService.getTaskById(id);
            if (!task) {
                res.status(404).json({ error: 'task not found' });
                return;
            }
            const imageKey = task.imageKey;
            // console.log('Image Key:', imageKey);

            if (imageKey === null || imageKey === '') {
                res.status(200).json({
                    message: 'There is no image for this task',
                });
            } else {
                await this.imageService.deleteImage(String(imageKey));
                await this.tasksService.updateTask(id, {
                    imageKey: '',
                    imageUrl: '',
                    imageUrlLastUpdateTime: null,
                } as ITaskDocument);
                res.status(200).json({
                    message: 'image deleted successfully',
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    //-----------------------------------------------------------------------------------------

    getCategories = async (req: Request, res: Response) => {
        try {
            const categories = await this.tasksService.getCategories();
            res.status(200).json({
                success: true,
                categories,
            });
        } catch (error) {
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    };

    applyTask = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const task = await this.tasksService.getTaskById(id);
            if (!task) {
                res.status(404).json({
                    success: false,
                    error: 'Task Not Found',
                });
                return;
            }
            if (task.customerId.toString() == req.user._id) {
                res.status(403).json({
                    success: false,
                    error: 'You are not allowed to apply to this task',
                });
                return;
            }
            if (task.status != 'Open') {
                res.status(403).json({
                    success: false,
                    error: 'Task is not open',
                });
                return;
            }
            const result = await this.tasksService.applyTask(
                id,
                req.user._id.toString(),
            );
            res.status(200).json({ success: true, result });
        } catch (error) {
            if (error instanceof CannotApplyTaskError) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
            } else {
                res.status(500).json({
                    sucess: false,
                    error: 'Internal Server Error',
                });
            }
        }
    };

    cancelTask = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const task = await this.tasksService.getTaskById(id);
            if (!task) {
                res.status(404).json({
                    success: false,
                    error: 'Task Not Found',
                });
                return;
            }
            if (task.customerId.toString() != req.user._id) {
                res.status(403).json({
                    success: false,
                    error: 'Cannot Cancel This Task',
                });
                return;
            }
            const result = await this.tasksService.cancelTask(id);
            res.status(200).json({ success: true, result });
        } catch (error) {
            if (error instanceof CannotCancelTaskError) {
                res.status(500).json({
                    success: false,
                    error: error.message,
                });
            } else {
                res.status(500).json({
                    sucess: false,
                    error: 'Internal Server Error',
                });
            }
        }
    };
}

export default TasksController;
