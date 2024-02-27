import e, { Request, Response } from 'express';
import { ValidationError } from '../errors/RepoError';
import { Service, Inject } from 'typedi';
import { TasksService, ITasksService } from '../services/TasksService';
import { ImageService } from '../services/ImageService';
import sharp from 'sharp';
import { CannotApplyTaskError } from '../errors/TaskError';

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
            var data = req.body;
            data.customerId = req.user._id;
            var data = req.body;
            data.customerId = req.user._id;
            const task = await this.tasksService.createTask(data);
            res.status(201).json({ task: task.toJSON() });
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
                    res.status(404).json({ error: 'Task not found' });
                    return;
                }
                res.status(200).json({ task: taskWithGeneralInfo.toJSON() });
                return;
            }
            // if (userId.toString() !== task.customerId.toString()) {
            //     const filteredTask = { ...task.toObject() };
            //     delete filteredTask.applications;
            //     delete filteredTask.hiredWorkers;
            //     res.status(200).json({ task: filteredTask });
            //     return;
            // }
            res.status(200).json({ task: task.toJSON() });
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    // image ---------------------------------------------------------------------------------
    getTaskImages = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = req.params.id;
            const task = await this.tasksService.getTaskById(id);
            if (!task) {
                res.status(404).json({ error: 'Task not found' });
                return;
            }
            const imageKeys = task.imageKeys;

            if (imageKeys) {
                const response = [];

                for (const imageKey of imageKeys) {
                    const seq = imageKey.seq;
                    const key = imageKey.imageKey;

                    // Get the image URL from the ImageService
                    const imageUrl = await this.imageService.getImageByKey(
                        String(key),
                    );

                    if (imageUrl) {
                        response.push({ seq, imageUrl });
                    }
                }

                res.status(200).json(response);
            } else {
                // Handle the case where imageKeys is undefined
                res.status(404).json({
                    error: 'ImageKeys not found for the task',
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    // upload 1 image
    uploadTaskImage = async (req: Request, res: Response): Promise<void> => {
        try {
            const taskID = req.params.id;
            const { seq } = req.body;
            const file = req.file;

            if (!file || isNaN(Number(seq))) {
                res.status(400).json({ error: 'Invalid input' });
                return;
            }

            // Generate a random number between 1 and 100000 (adjust the range as needed)
            const randomNum = Math.floor(Math.random() * 100000) + 1;

            try {
                const metadata = await sharp(file.buffer).metadata();
                const fileExtension = metadata.format!.toLowerCase();
                const key = `${taskID}_${randomNum}.${fileExtension}`;

                const task = await this.tasksService.getTaskById(taskID);

                if (!task) {
                    res.status(404).json({ error: 'Task not found' });
                    return;
                }

                // Get the current imageKeys array
                const currentImageKeys = task.imageKeys || [];

                const seqExists = currentImageKeys.find(
                    image => Number(image.seq) === Number(seq),
                );

                if (seqExists) {
                    res.status(400).json({ error: 'Image seq already exists' });
                    return;
                }

                // Update the array with the new image information
                currentImageKeys.push({ seq, imageKey: key });

                task.imageKeys = currentImageKeys;

                await this.tasksService.updateTask(taskID, task);

                // Upload the file to AWS S3 or your preferred storage
                await this.imageService.createImage(
                    file.buffer,
                    file.mimetype,
                    key,
                );

                res.status(201).json({
                    message: 'Task image uploaded successfully',
                });
            } catch (error) {
                res.status(400).json({
                    error,
                });
                return;
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    // Change the sequence number in imageKeys (image that have seq = oldSeq to be newSeq)
    changeImageSeq = async (req: Request, res: Response): Promise<void> => {
        try {
            const taskID = req.params.id;
            const { oldSeq, newSeq } = req.body;

            if (typeof oldSeq !== 'number' || typeof newSeq !== 'number') {
                res.status(400).json({ error: 'Invalid input' });
                return;
            }

            const task = await this.tasksService.getTaskById(taskID);

            if (!task) {
                res.status(404).json({ error: 'Task not found' });
                return;
            }

            const imageKeys = task.imageKeys;

            if (imageKeys) {
                // Update the sequence number in imageKeys array
                task.imageKeys = imageKeys.map(imageKey => {
                    if (imageKey.seq === oldSeq) {
                        return { ...imageKey, seq: newSeq };
                    }
                    return imageKey;
                });
                await this.tasksService.updateTask(taskID, task);

                res.status(200).json({ success: true });
            } else {
                // Handle the case where imageKeys is undefined
                res.status(404).json({
                    error: 'ImageKeys not found for the task',
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    //delete every image that have seq number in the seqs list input
    deleteTaskImagesBySeqs = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        try {
            const taskID = req.params.id;
            const { seqs } = req.body;
            if (
                !seqs ||
                !Array.isArray(seqs) ||
                seqs.some(seq => isNaN(Number(seq)))
            ) {
                res.status(400).json({
                    error: 'Invalid input or non-numeric seq in the array',
                });
                return;
            }

            const task = await this.tasksService.getTaskById(taskID);

            if (!task) {
                res.status(404).json({ error: 'Task not found' });
                return;
            }

            const imageKeys = task.imageKeys;

            if (imageKeys) {
                // Filter out the imageKeys with seqs to be deleted
                const remainingImageKeys = imageKeys.filter(
                    imageKey => !seqs.includes(imageKey.seq),
                );

                // Delete images from AWS S3 bucket
                for (const imageKey of imageKeys) {
                    if (seqs.includes(imageKey.seq)) {
                        const key = imageKey.imageKey;
                        await this.imageService.deleteImage(String(key));
                    }
                }

                // Update the task with the remaining imageKeys
                task.imageKeys = remainingImageKeys;
                await this.tasksService.updateTask(taskID, task);

                res.status(200).json(remainingImageKeys);
            } else {
                // Handle the case where imageKeys is undefined
                res.status(404).json({
                    error: 'ImageKeys not found for the task',
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    deleteTaskAllImages = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        try {
            const id = req.params.id;
            const task = await this.tasksService.getTaskById(id);
            if (!task) {
                res.status(404).json({ error: 'Task not found' });
                return;
            }
            const imageKeys = task.imageKeys;

            if (imageKeys && imageKeys.length > 0) {
                for (const imageKey of imageKeys) {
                    const key = imageKey.imageKey;

                    try {
                        // Delete image from AWS S3 bucket
                        await this.imageService.deleteImage(String(key));
                    } catch (deleteError) {
                        console.error(
                            `Error deleting image with key ${key}:`,
                            deleteError,
                        );
                        // Continue with the deletion process even if one image deletion fails
                    }
                }

                // Clear the imageKeys array in the task
                task.imageKeys = [];

                // Update the task to remove all imageKeys
                await this.tasksService.updateTask(id, task);

                res.status(200).json(true);
            } else {
                // Handle the case where imageKeys is undefined
                res.status(404).json({
                    error: 'ImageKeys not found for the task',
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

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
                res.status(404).json({ error: 'Task not found' });
                return;
            }
            const result = await this.tasksService.applyTask(
                id,
                req.user._id.toString(),
            );
            res.status(200).json({ success: true, result });
        } catch (error) {
            if (error instanceof CannotApplyTaskError) {
                res.status(500).json({
                    error: error.name,
                    details: error.message,
                });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    };
}

export default TasksController;
