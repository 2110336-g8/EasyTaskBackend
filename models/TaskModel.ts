import mongoose, { Document, Types, Schema } from 'mongoose';
import categoryData from '../assets/categories/categorieslist.json';

export interface ITask {
    title: string;
    category: string;
    description?: string;
    imageKey?: string | null;
    imageUrl?: string | null;
    imageUrlLastUpdateTime?: Date | null;
    location?: {
        name: string;
        latitude: number;
        longitude: number;
    };
    status: 'Open' | 'InProgress' | 'Completed' | 'Closed' | 'Cancelled';
    wages: number; // smallest unit
    startDate: Date;
    endDate: Date;
    workers: number; //
    customerId: Types.ObjectId;
    applicants: Array<{
        userId: Types.ObjectId;
        status: 'Pending' | 'Offering' | 'Accepted' | 'Rejected' | 'NotProceed';
        createdAt: Date;
    }>;
    hiredWorkers: Array<{
        userId: Types.ObjectId;
        status: 'InProgress' | 'Submit' | 'Completed' | 'Cancelled';
        isRevised: boolean;
        createdAt: Date;
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
            type: String,
            // required: [true, 'Category is required'],
            default: categoryData.categories[0],
            validate: {
                validator: function (value: string) {
                    return categoryData.categories.includes(value);
                },
                message: 'Invalid category',
            },
        },
        description: {
            type: String,
        },
        imageKey: {
            type: String,
        },
        imageUrl: {
            type: String,
        },
        imageUrlLastUpdateTime: {
            type: Date,
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
        status: {
            type: String,
            enum: ['Open', 'InProgress', 'Completed', 'Closed'],
            required: [true, 'Task status is required'],
            maxlength: [
                255,
                'Task status cannot be longer than 255 characters',
            ],
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
        applicants: {
            type: [
                {
                    userId: {
                        type: Schema.Types.ObjectId,
                        required: [true, 'UserId for applicant is required'],
                        ref: 'User',
                    },
                    status: {
                        type: String,
                        enum: [
                            'Pending',
                            'Offering',
                            'Accepted',
                            'Rejected',
                            'NotProceed',
                        ],
                        required: [true, 'Application status is required'],
                        default: 'Pending',
                    },
                    createdAt: {
                        type: Date,
                        required: [
                            true,
                            'Timestamp for application is required',
                        ],
                    },
                },
            ],
            default: [],
        },
        hiredWorkers: {
            type: [
                {
                    userId: {
                        type: Schema.Types.ObjectId,
                        required: [true, 'UserId for hiring is required'],
                        ref: 'User',
                    },
                    status: {
                        type: String,
                        enum: [
                            'InProgress',
                            'Submit',
                            'Completed',
                            'Cancelled',
                        ],
                        required: [true, 'Hired worker status is required'],
                        default: 'InProgress',
                    },
                    isRevised: {
                        type: Boolean,
                        required: [true, 'IsRevised flag is required'],
                        default: false,
                    },
                    createdAt: {
                        type: Date,
                        required: [
                            true,
                            'Timestamp for application is required',
                        ],
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

export const TaskModel = mongoose.model<ITaskDocument>('Task', TaskSchema);
