import mongoose, { Document, Types, Schema } from 'mongoose';
import categoryData from '../assets/categories/categorieslist.json';

export interface ITask {
    title: string;
    category: string;
    description?: string;
    imageKeys?: Array<{ seq: number; imageKey: string }>;
    location?: {
        name: string;
        latitude: number;
        longitude: number;
    };
    status: 'Open' | 'In Progress' | 'Completed' | 'Closed';
    wages: number; // smallest unit
    startDate: Date;
    endDate: Date;
    workers: number; //
    customerId: Types.ObjectId;
    applicants: Array<{
        userId: Types.ObjectId;
        status: 'Pending' | 'Accepted' | 'Rejected' | 'Canceled';
        createdAt: Date;
    }>;
    hiredWorkers: Array<{
        userId: Types.ObjectId;
        status: 'In Progress' | 'Completed' | 'Canceled';
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
        status: {
            type: String,
            enum: ['Open', 'In Progress', 'Completed', 'Closed'],
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
                        enum: ['Pending', 'Accepted', 'Rejected', 'Cancel'],
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
                        enum: ['In Progress', 'Completed', 'Cancel'],
                        required: [true, 'Hired worker status is required'],
                        default: 'In Progress',
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

// TaskSchema.pre('save', function (next) {

//     // Check uniqueness of userIds within the same task applications or the same hired workers
//     // Check if customerId is equal to any userIds

//     const task = this as ITaskDocument;
//     const applicantIds = new Set();
//     for (const applicant of task.applicants) {
//         if (applicant.status == 'Pending' || applicant.status == 'Accepted') {
//             if (applicantIds.has(applicant.userId.toString())) {
//                 const error = new ValidationError(
//                     `Duplicate (pending or accepted) userId '${applicant.userId}' within the same task application.`,
//                 );
//                 return next(error);
//             }
//             applicantIds.add(applicant.userId.toString());
//         }

//         if (task.customerId.toString() === applicant.userId.toString()) {
//             const error = new ValidationError(
//                 `CustomerId '${task.customerId}' cannot be equal to any userId in the task application.`,
//             );
//             return next(error);
//         }
//     }
//     console.log(applicantIds);
//
//     const workerIds = new Set();
//     for (const worker of task.hiredWorkers) {
//         if (workerIds.has(worker.userId.toString())) {
//             const error = new ValidationError(
//                 `Duplicate userId '${worker.userId}' within the same task hiring.`,
//             );
//             return next(error);
//         }
//         workerIds.add(worker.userId.toString());

//         if (task.customerId.toString() === worker.userId.toString()) {
//             const error = new ValidationError(
//                 `CustomerId '${task.customerId}' cannot be equal to any userId in the task hiring.`,
//             );
//             return next(error);
//         }
//     }

//     next();
// });

export const TaskModel = mongoose.model<ITaskDocument>('Task', TaskSchema);
