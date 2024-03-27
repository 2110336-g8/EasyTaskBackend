import { Request, Response } from 'express';
import { ValidationError } from '../errors/RepoError';
import { Service, Inject } from 'typedi';
import { TasksService, ITasksService } from '../services/TasksService';
import { UsersService, IUsersService } from '../services/UsersService';
import sharp from 'sharp';
import { groupBy } from 'lodash';
import {
    CannotGetTaskOfError,
    CannotApplyTaskError,
    CannotUpdateStateError,
    CannotSelectCandidateError,
    CannotResponseOfferError,
    CannotStartTaskError,
    CannotDismissTaskError,
    CannotSubmitTaskError,
    CannotAcceptTaskError,
    CannotRequestRevisionError,
} from '../errors/TaskError';
import dotenv from 'dotenv';
dotenv.config({ path: './config/config.env' });

@Service()
class TasksController {
    private tasksService: ITasksService;
    private usersService: IUsersService;

    constructor(
        @Inject(() => TasksService) tasksService: ITasksService,
        @Inject(() => UsersService) usersService: IUsersService,
    ) {
        this.tasksService = tasksService;
        this.usersService = usersService;
    }

    createTask = async (req: Request, res: Response): Promise<void> => {
        try {
            var data = req.body;
            data.customerId = req.user._id;
            const task = await this.tasksService.createTask(data);
            res.status(201).json({ success: true, task: task.toJSON() });
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

            //not the task's owner
            if (userId.toString() !== task.customerId.toString()) {
                const user = await this.usersService.getUserById(
                    task.customerId.toString(),
                );
                if (!user) {
                    console.log('user not found');
                    res.status(404).json({ error: 'User not found' });
                    return;
                }
                const customerInfo = {
                    _id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phoneNumber: user.phoneNumber,
                    imageUrl: user.imageUrl,
                };
                //add status in the response
                let viewStatus = '';
                if (task.status == 'Open') {
                    //check if userId is one of applicant's userId then set viewStatus = applicant's status
                    const applicant = task.applicants.find(
                        applicant =>
                            applicant.userId.toString() === userId.toString(),
                    );
                    if (applicant) {
                        viewStatus = applicant.status;
                    } else {
                        viewStatus = 'Open';
                    }
                } else if (task.status == 'InProgress') {
                    //check if userId is one of hiredWorker's userId then set viewStatus = hiredworker's status
                    const hiredWorker = task.hiredWorkers.find(
                        hiredWorker =>
                            hiredWorker.userId.toString() === userId.toString(),
                    );
                    if (hiredWorker) {
                        viewStatus = hiredWorker.status;
                    } else {
                        const applicant = task.applicants.find(
                            applicant =>
                                applicant.userId.toString() ===
                                userId.toString(),
                        );
                        if (applicant) {
                            viewStatus = applicant.status;
                        } else {
                            throw new Error(
                                'You are not allowed to view this task',
                            );
                        }
                    }
                } else {
                    const hiredWorker = task.hiredWorkers.find(
                        hiredWorker =>
                            hiredWorker.userId.toString() === userId.toString(),
                    );
                    if (hiredWorker) {
                        viewStatus = hiredWorker.status;
                    } else {
                        const applicant = task.applicants.find(
                            applicant =>
                                applicant.userId.toString() ===
                                userId.toString(),
                        );
                        if (applicant) {
                            viewStatus = applicant.status;
                        } else {
                            viewStatus = task.status;
                        }
                    }
                }

                const taskWithGeneralInfo =
                    await this.tasksService.getTaskWithGeneralInfoById(id);
                if (taskWithGeneralInfo) {
                    res.status(200).json({
                        task: taskWithGeneralInfo,
                        customerInfo: customerInfo,
                        status: viewStatus,
                    });
                } else {
                    res.status(404).json({ error: 'Task not found' });
                }
            } else {
                //user is the task owner
                const applicantsInfo = [];
                const hiredWorkersInfo = [];

                if (task.applicants && task.applicants.length > 0) {
                    for (const applicant of task.applicants) {
                        const applicantId = applicant.userId;
                        const applicantUser =
                            await this.usersService.getUserById(
                                applicantId.toString(),
                            );
                        if (applicantUser) {
                            applicantsInfo.push({
                                _id: applicantUser.id,
                                firstName: applicantUser.firstName,
                                lastName: applicantUser.lastName,
                                imageUrl: applicantUser.imageUrl,
                                phoneNumber: applicantUser.phoneNumber,
                                status: applicant.status,
                            });
                        }
                    }
                }
                if (task.hiredWorkers && task.hiredWorkers.length > 0) {
                    for (const worker of task.hiredWorkers) {
                        const workerId = worker.userId;
                        const workerStatus = worker.status;
                        const workerUser = await this.usersService.getUserById(
                            workerId.toString(),
                        );
                        if (workerUser) {
                            hiredWorkersInfo.push({
                                _id: workerUser.id,
                                firstName: workerUser.firstName,
                                lastName: workerUser.lastName,
                                imageUrl: workerUser.imageUrl,
                                phoneNumber: workerUser.phoneNumber,
                                status: workerStatus,
                            });
                        }
                    }
                }
                res.status(200).json({
                    task: task,
                    applicantsInfo: applicantsInfo,
                    hiredWorkersInfo: hiredWorkersInfo,
                });
            }
        } catch (error) {
            const err = error as Error;
            res.status(500).json({ error: err.message });
        }
    };

    getTasksOf = async (req: Request, res: Response) => {
        try {
            const userId = req.params.userId;
            if (userId != req.user._id) {
                res.status(403).json({
                    error: 'You are not authorized to view information',
                });
            }
            const status = req.query.status as string;
            const task = await this.tasksService.getTasksOf(userId, status);
            res.status(200).json({ enrolled_tasks: task });
        } catch (error) {
            if (error instanceof CannotGetTaskOfError) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    };

    getAdvertisements = async (req: Request, res: Response): Promise<void> => {
        try {
            const customerId = req.params.customerId;
            const status = req.query.status as string | undefined;

            const allowedStatusValues = [
                'Open',
                'InProgress',
                'Completed',
                'Dismissed',
            ];
            if (status && !allowedStatusValues.includes(status)) {
                res.status(400).json({ error: 'Invalid status parameter' });
                return;
            }
            const tasks = await this.tasksService.getAdvertisement(
                customerId,
                status || '',
            );
            if (status == undefined || !status) {
                const groupedTasks = groupBy(tasks, 'status');
                res.status(200).json({ tasks: groupedTasks });
            }
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
                res.status(404).json({ error: 'task not found' });
                return;
            }
            const imageUrl = await this.tasksService.getTaskImage(id);

            // If the image URL exists, redirect to the image
            if (imageUrl) {
                res.status(200).json(imageUrl);
            } else {
                res.status(404).json({ error: 'Task image not found' });
            }
        } catch (error) {
            console.log('cannot get by owner id');
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
                console.log(key);

                await this.tasksService.updateTaskImage(
                    taskId,
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
            const taskId = req.params.id;
            const task = await this.tasksService.getTaskById(taskId);
            if (!task) {
                res.status(404).json({ error: 'Task not found' });
                return;
            }

            // Delete the task's image
            if (!task.imageKey || task.imageKey == undefined) {
                res.status(200).json({
                    message: 'There is no Task image',
                });
            } else {
                await this.tasksService.deleteTaskImage(taskId, task.imageKey);

                res.status(200).json({
                    message: 'Task image deleted successfully',
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
            const taskId = req.params.id;
            const task = await this.tasksService.getTaskById(taskId);
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
            if (task.endDate < new Date()) {
                res.status(403).json({
                    success: false,
                    error: 'Task is closed. The application period has ended.',
                });
                return;
            }
            if (task.status != 'Open') {
                res.status(403).json({
                    success: false,
                    error: 'Task is not open for applications. The owner has already started the task.',
                });
                return;
            }

            const result = await this.tasksService.applyTask(
                taskId,
                req.user._id.toString(),
            );
            res.status(200).json({ success: true, task: result });
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

    getCandidate = async (req: Request, res: Response) => {
        try {
            const taskId = req.params.id;
            const task = await this.tasksService.getTaskById(taskId);
            if (!task) {
                res.status(404).json({ error: 'Task Not Found' });
                return;
            }
            if (task.customerId.toString() != req.user._id) {
                res.status(403).json({
                    error: 'You are not allowed to access the candidates of this task',
                });
                return;
            }
            const result = await this.tasksService.getCandidate(taskId);
            if (!result) {
                res.status(404).json({ error: 'Task Not Found' });
                return;
            }
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    selectCandidate = async (req: Request, res: Response) => {
        try {
            const taskId = req.params.id;
            const selectedCandidates = req.body.selectedCandidates;
            const task = await this.tasksService.getTaskById(taskId);
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
                    error: 'You are not allowed to select candidate for this task',
                });
                return;
            }
            const result = await this.tasksService.selectCandidate(
                taskId,
                selectedCandidates,
            );
            res.status(200).json({ success: true, tasks: result });
        } catch (error) {
            if (error instanceof CannotUpdateStateError) {
                res.status(500).json({
                    sucess: false,
                    error: error.message,
                });
            } else if (error instanceof CannotSelectCandidateError) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    };

    acceptOffer = async (req: Request, res: Response) => {
        try {
            const taskId = req.params.id;
            const userId = req.user._id;
            const task = await this.tasksService.getTaskById(taskId);
            if (!task) {
                res.status(404).json({
                    success: false,
                    error: 'Task Not Found',
                });
                return;
            }
            await this.tasksService.responseOffer(
                taskId,
                userId.toString(),
                true,
            );
            res.status(200).json({
                success: true,
                message: 'You have successfully accepted the offer.',
            });
        } catch (error) {
            if (error instanceof CannotResponseOfferError) {
                res.status(400).json({
                    sucess: false,
                    error: error.message,
                });
            } else if (error instanceof CannotUpdateStateError) {
                res.status(500).json({
                    sucess: false,
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

    rejectOffer = async (req: Request, res: Response) => {
        try {
            const taskId = req.params.id;
            const userId = req.user._id;
            const task = await this.tasksService.getTaskById(taskId);
            if (!task) {
                res.status(404).json({
                    success: false,
                    error: 'Task Not Found',
                });
                return;
            }
            await this.tasksService.responseOffer(
                taskId,
                userId.toString(),
                false,
            );
            res.status(200).json({
                success: true,
                message: 'You have successfully rejected the offer.',
            });
        } catch (error) {
            if (error instanceof CannotResponseOfferError) {
                res.status(400).json({
                    sucess: false,
                    error: error.message,
                });
            } else if (error instanceof CannotUpdateStateError) {
                res.status(500).json({
                    sucess: false,
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

    startTask = async (req: Request, res: Response) => {
        try {
            const taskId = req.params.id;
            const task = await this.tasksService.getTaskById(taskId);
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
                    error: 'You are not allowed to start this task',
                });
                return;
            }
            const result = await this.tasksService.startTask(taskId);
            res.status(200).json({ success: true, task: result });
        } catch (error) {
            if (error instanceof CannotStartTaskError) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
            } else if (error instanceof CannotUpdateStateError) {
                res.status(500).json({
                    sucess: false,
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

    dismissTask = async (req: Request, res: Response) => {
        try {
            const taskId = req.params.id;
            const task = await this.tasksService.getTaskById(taskId);
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
                    error: 'You are not allowed to dismiss this task',
                });
                return;
            }
            if (task.status === 'Open') {
                const result = await this.tasksService.dismissOpenTask(taskId);
                res.status(200).json({ success: true, result });
            } else if (task.status === 'InProgress') {
                const result =
                    await this.tasksService.dismissInProgressTask(taskId);
                res.status(200).json({ success: true, result });
            } else {
                res.status(400).json({
                    success: false,
                    error: 'This task have already been dismissed or completed',
                });
            }
        } catch (error) {
            if (error instanceof CannotDismissTaskError) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
            } else if (error instanceof CannotUpdateStateError) {
                res.status(500).json({
                    sucess: false,
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

    submitTask = async (req: Request, res: Response) => {
        try {
            const taskId = req.params.id;
            const userId = req.user._id;
            const task = await this.tasksService.getTaskById(taskId);
            if (!task) {
                res.status(404).json({
                    success: false,
                    error: 'Task Not Found',
                });
                return;
            }
            await this.tasksService.submitTask(taskId, userId.toString());
            res.status(200).json({
                success: true,
                message: 'You have successfully submitted work.',
            });
        } catch (error) {
            if (error instanceof CannotSubmitTaskError) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
            } else if (error instanceof CannotUpdateStateError) {
                res.status(500).json({
                    sucess: false,
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

    acceptTask = async (req: Request, res: Response) => {
        try {
            const taskId = req.params.id;
            const workerId = req.body.employee;
            const task = await this.tasksService.getTaskById(taskId);
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
                    error: 'You are not allowed to accept work of this task',
                });
                return;
            }
            const result = await this.tasksService.acceptTask(taskId, workerId);
            res.status(200).json({
                success: true,
                task: result,
            });
        } catch (error) {
            if (error instanceof CannotAcceptTaskError) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
            } else if (error instanceof CannotUpdateStateError) {
                res.status(500).json({
                    sucess: false,
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

    requestRevision = async (req: Request, res: Response) => {
        try {
            const taskId = req.params.id;
            const workerId = req.body.employee;
            const task = await this.tasksService.getTaskById(taskId);
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
                    error: 'You are not allowed to request revision of this task',
                });
                return;
            }
            const result = await this.tasksService.requestRevision(
                taskId,
                workerId,
            );
            res.status(200).json({
                success: true,
                task: result,
            });
        } catch (error) {
            if (error instanceof CannotRequestRevisionError) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
            } else if (error instanceof CannotUpdateStateError) {
                res.status(500).json({
                    sucess: false,
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
