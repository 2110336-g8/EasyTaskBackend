import mongoose, { Document, Types, Schema } from 'mongoose';
import { ValidationError } from '../errors/RepoError';

export interface ITask {
    title: string;
    category?: string;
    description?: string;
    imageKeys?: Array<{ seq: number; imageKey: string }>;
    location?: string;
    state: 'New' | 'In Progress' | 'Completed' | 'Cancel';
    wages: number; // smallest unit
    startDate: Date;
    endDate: Date;
    workers: number; //
    customerID: Types.ObjectId;
    hiredWorkers: Array<{
        workerID: Types.ObjectId;
        status: 'In Progress' | 'Completed' | 'Cancel';
    }>;
}

export interface ITaskDocument extends ITask, Document {}

const TaskSchema = new Schema<ITaskDocument>(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            maxlength: [255, 'Title cannot be longer than 255 characters'],
        },
        category: {
            type: String,
            maxlength: [255, 'Category cannot be longer than 255 characters'],
        },
        description: {
            type: String,
        },
        imageKeys: {
            type: [
                {
                    seq: {
                        type: Number,
                        required: [true, 'Sequence number is required'],
                    },
                    imageKey: {
                        type: String,
                        required: [true, 'Image key is required'],
                    },
                },
            ],
        },
        location: {
            type: String,
            maxlength: [255, 'Location cannot be longer than 255 characters'],
        },
        state: {
            type: String,
            enum: ['New', 'In Progress', 'Completed', 'Cancel'],
            required: [true, 'State is required'],
            maxlength: [255, 'State cannot be longer than 255 characters'],
            default: 'New',
        },
        wages: {
            type: Number,
            required: [true, 'Wage is required'],
        },
        workers: {
            type: Number,
            required: [true, 'Worker number is required'],
        },
        startDate: {
            type: Date,
            required: [true, 'Startdate is required'],
        },
        endDate: {
            type: Date,
            required: [true, 'Enddate is required'],
        },
        customerID: {
            type: Schema.Types.ObjectId,
            required: [true, 'Customer ID is required'],
            ref: 'User',
        },
        hiredWorkers: {
            type: [
                {
                    workerID: {
                        type: Schema.Types.ObjectId,
                        required: [true, 'WorkerID is required'],
                        ref: 'User',
                    },
                    status: {
                        type: String,
                        enum: ['In Progress', 'Completed', 'Cancel'],
                        required: [true, 'Status is required'],
                        default: 'In Progress',
                    },
                },
            ],
            default: [],
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    },
);

TaskSchema.pre('save', function (next) {
    const task = this as ITaskDocument;

    // Check uniqueness of workerIDs within the same task
    // Check if customerID is equal to any workerID
    const workerIDs = new Set();
    for (const worker of task.hiredWorkers) {
        if (workerIDs.has(worker.workerID.toString())) {
            const error = new ValidationError(
                `Duplicate workerID '${worker.workerID}' within the same task.`,
            );
            return next(error);
        }
        workerIDs.add(worker.workerID.toString());

        if (task.customerID.toString() === worker.workerID.toString()) {
            const error = new ValidationError(
                `customerID '${task.customerID}' cannot be equal to any workerID within the same task.`,
            );
            return next(error);
        }
    }

    next();
});

export const TaskModel = mongoose.model<ITaskDocument>('Task', TaskSchema);
