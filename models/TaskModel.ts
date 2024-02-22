import mongoose, { Document, Types, Schema } from 'mongoose';
import { ValidationError } from '../errors/RepoError';
import categoryData from '../assets/categories/categorieslist.json';

export interface ITask {
    title: string;
    category: number;
    description?: string;
    imageKeys?: Array<{ seq: number; imageKey: string }>;
    location?: {
        name: string;
        latitude: number;
        longitude: number;
    };
    state: 'Open' | 'In Progress' | 'Completed' | 'Cancel';
    wages: number; // smallest unit
    startDate: Date;
    endDate: Date;
    workers: number; //
    customerId: Types.ObjectId;
    hiredWorkers: Array<{
        workerId: Types.ObjectId;
        status: 'In Progress' | 'Completed' | 'Cancel';
    }>;
    createdAt: Date;
    updatedAt: Date;
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
            type: Number,
            required: [true, 'Category is required'],
            default: 0,
            validate: {
                validator: function (value: number) {
                    return value >= 0 && value < categoryData.categories.length;
                },
                message: 'Invalid category',
            },
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
            type: {
                name: {
                    type: String,
                    maxlength: [
                        255,
                        'Location name cannot be longer than 255 characters',
                    ],
                    required: [true, 'Location name is required'],
                },
                latitude: {
                    type: Number,
                    min: -90,
                    max: 90,
                    required: [true, 'Latitude of location is required'],
                },
                longitude: {
                    type: Number,
                    min: -180,
                    max: 180,
                    required: [true, 'Longitude of location is required'],
                },
            },
            _id: false,
        },
        state: {
            type: String,
            enum: ['Open', 'In Progress', 'Completed', 'Cancel', 'Expired'],
            required: [true, 'State is required'],
            maxlength: [255, 'State cannot be longer than 255 characters'],
            default: 'Open',
        },
        wages: {
            type: Number,
            required: [true, 'Wage is required'],
            validate: {
                validator: function (value: number) {
                    return value >= 0;
                },
                message: 'Wages cannot be negative',
            },
        },
        workers: {
            type: Number,
            required: [true, 'Worker number is required'],
            validate: {
                validator: function (value: number) {
                    return value > 0;
                },
                message: 'Minimum worker number is one',
            },
        },
        startDate: {
            type: Date,
            required: [true, 'Startdate is required'],
        },
        endDate: {
            type: Date,
            required: [true, 'Enddate is required'],
        },
        customerId: {
            type: Schema.Types.ObjectId,
            required: [true, 'Customer Id is required'],
            ref: 'User',
        },
        hiredWorkers: {
            type: [
                {
                    workerId: {
                        type: Schema.Types.ObjectId,
                        required: [true, 'WorkerId is required'],
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

    // Check uniqueness of workerIds within the same task
    // Check if customerId is equal to any workerId
    const workerIds = new Set();
    for (const worker of task.hiredWorkers) {
        if (workerIds.has(worker.workerId.toString())) {
            const error = new ValidationError(
                `Duplicate workerId '${worker.workerId}' within the same task.`,
            );
            return next(error);
        }
        workerIds.add(worker.workerId.toString());

        if (task.customerId.toString() === worker.workerId.toString()) {
            const error = new ValidationError(
                `customerId '${task.customerId}' cannot be equal to any workerId within the same task.`,
            );
            return next(error);
        }
    }

    next();
});

export const TaskModel = mongoose.model<ITaskDocument>('Task', TaskSchema);
