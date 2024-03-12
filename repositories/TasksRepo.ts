import { ITask, ITaskDocument, TaskModel } from '../models/TaskModel';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { Service } from 'typedi';
import { FilterQuery } from 'mongoose';

export interface ITasksRepository extends IRepository<ITask> {
    findTasksByPage: (
        page: number,
        taskPerPage: number,
        filter?: FilterQuery<ITaskDocument>,
    ) => Promise<{ tasks: ITaskDocument[]; count: number }>;
    countAllTasks: () => Promise<number | null>;
    findOneWithGeneralInfo: (id: string) => Promise<ITaskDocument | null>;
    addApplicants: (
        taskId: string,
        userId: string,
        timestamps: Date,
    ) => Promise<ITaskDocument | null>;
    closeTask: (taskId: string) => Promise<ITaskDocument | null>;
}

@Service()
export class TasksRepository
    extends BaseMongooseRepository<ITask>
    implements ITasksRepository
{
    constructor() {
        super(TaskModel);
    }

    findTasksByPage = async (
        page: number,
        taskPerPage: number,
        filter: FilterQuery<ITaskDocument> = {},
    ): Promise<{ tasks: ITaskDocument[]; count: number }> => {
        const tasks = await this._model
            .find(filter)
            .select({
                applicants: 0,
                hiredWorkers: 0,
            })
            .skip((page - 1) * taskPerPage)
            .limit(taskPerPage);

        const count = await this._model.countDocuments(filter);

        return { tasks, count };
    };

    async countAllTasks(): Promise<number> {
        const count = await this._model.countDocuments();
        return count;
    }

    findOneWithGeneralInfo = async (
        id: string,
    ): Promise<ITaskDocument | null> => {
        try {
            const task = await this._model.findById(id).select({
                applicants: 0,
                hiredWorkers: 0,
            });
            return task;
        } catch (error) {
            return null;
        }
    };

    addApplicants = async (
        taskId: string,
        userId: string,
        timestamps: Date,
    ): Promise<ITaskDocument | null> => {
        try {
            // Check if there is an existing applicant with the same userId
            const existingApplicant = await this._model.findOne(
                { _id: taskId, 'applicants.userId': userId },
                { 'applicants.$': 1 },
            );

            // If an applicant with the same userId exists and its status is "Pending" or "Accepted", return null
            if (
                existingApplicant &&
                ['Pending', 'Accepted'].includes(
                    existingApplicant.applicants[0].status,
                )
            ) {
                console.error(
                    'Adding failed: An applicant with the same userId already exists with status "Pending" or "Accepted"',
                );
                return null;
            }

            // If no existing applicant with the same userId or its status is not "Pending" or "Accepted", proceed with the update
            const updatedTask = await this._model.findOneAndUpdate(
                { _id: taskId },
                {
                    $push: {
                        applicants: {
                            userId: userId,
                            createdAt: timestamps,
                        },
                    },
                },
                { new: true },
            );
            if (!updatedTask) {
                console.error(
                    'Adding failed: Document not found or constraint violated',
                );
                return null;
            }

            return updatedTask;
        } catch (error) {
            console.error('Error adding applicants:', error);
            throw error;
        }
    };

    closeTask = async (taskId: string): Promise<ITaskDocument | null> => {
        try {
            // Update the task status to 'Closed' and update all applicants to 'Rejected'
            const updatedTask = await this._model.findOneAndUpdate(
                { _id: taskId },
                [
                    { $set: { status: 'Closed' } }, // Update the task status to 'Closed'
                    { $set: { 'applicants.$[].status': 'Rejected' } }, // Update all applicants to 'Rejected'
                ],
                { new: true }, // to return the updated document
            );

            if (!updatedTask) {
                console.error(
                    'Close failed: Document not found or constraint violated',
                );
                return null;
            }

            return updatedTask;
        } catch (error) {
            console.error('Error closing task:', error);
            throw error;
        }
    };
}
