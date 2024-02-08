import e, { Request, Response } from 'express';
import { ValidationError } from '../errors/RepoError';
import { Service, Inject } from 'typedi';
import TasksService, { ITasksService } from '../services/TasksService';
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

    uploadTaskImage = async (req: Request, res: Response): Promise<void> => {
        try {
            const taskId = req.params.id;
            const { seq } = req.body;
            const file = req.body;
            // console.log(req.body);
            if (!file) {
                console.log('no file');
                res.status(400).json({ error: 'No file uploaded' });
                return;
            }

            if (!file || !seq) {
                res.status(400).json({ error: 'Invalid input' });
                return;
            }

            // Generate a random number between 1 and 100000 (adjust the range as needed)
            const randomNum = Math.floor(Math.random() * 100000) + 1;

            // Use sharp to check if the file is an image
            try {
                const metadata = await sharp(file.buffer).metadata();

                // Extract the file extension from the originalname (e.g., '.jpg')
                const fileExtension = metadata.format!.toLowerCase();

                // Generate the imageKey using the taskId, seq, randomNum, and fileExtension
                const key = `${taskId}_${randomNum}.${fileExtension}`;

                // Update the task's imageKeys in your database
                await this.tasksService.updateTask(taskId, {
                    $push: { imageKeys: { seq, imageKey: key } },
                });

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
                    error: 'Uploaded file is not a valid image',
                });
                return;
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    deleteTaskImagesBySeqs = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        try {
            const taskId = req.params.id;
            const { seqs } = req.body;

            if (!seqs || !Array.isArray(seqs)) {
                res.status(400).json({ error: 'Invalid input' });
                return;
            }

            const task = await this.tasksService.getTaskById(taskId);

            if (!task) {
                res.status(404).json({ error: 'Task not found' });
                return;
            }

            const imageKeys = task.imageKeys;

            if (imageKeys) {
                for (const imageKey of imageKeys) {
                    if (seqs.includes(imageKey.seq)) {
                        const key = imageKey.imageKey;
                        // Delete image from AWS S3 bucket
                        await this.imageService.deleteImage(String(key));
                    }
                }

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

            if (imageKeys) {
                for (const imageKey of imageKeys) {
                    const key = imageKey.imageKey;
                    //delete image from aws s3 bucket
                    await this.imageService.deleteImage(String(key));
                }

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
