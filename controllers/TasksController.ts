import e, { Request, Response } from 'express';
import { ValidationError } from '../errors/RepoError';
import { Service, Inject } from 'typedi';
import { TasksService, ITasksService } from '../services/TasksService';
import { ImageService } from '../services/ImageService';
import sharp from 'sharp';

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
            res.status(201).json(task);
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

    getTasks = async (req: Request, res: Response) => {
        try {
            const taskPage = parseInt(req.params.page) || 1;
            const taskPerPage = parseInt(req.query.size as string) || 8;

            const tasks = await this.tasksService.getTaskList(
                taskPage,
                taskPerPage,
            );
            res.status(200).json({
                success: true,
                currentPage: taskPage,
                size: taskPerPage,
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
            const task = await this.tasksService.getTaskById(id);
            if (!task) {
                res.status(404).json({ error: 'Task not found' });
                return;
            }
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
}

export default TasksController;
