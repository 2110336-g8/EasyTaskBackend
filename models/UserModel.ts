import mongoose, { Document, ObjectId, Types, Schema } from 'mongoose';
import { genSalt, hash } from 'bcrypt';
import sanitize = require('sanitize-html');

export interface IUser {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    description?: string;
    imageKey?: string;
    imageUrl?: string;
    imageUrlLastUpdateTime?: Date;
    bankId?: ObjectId;
    bankAccName?: string;
    bankAccNo?: string;
    applications: Array<{
        taskId: Types.ObjectId;
        status: 'Pending' | 'Accepted' | 'Rejected' | 'Cancel';
        createAt: Date;
    }>;
    tasks: Array<{
        taskId: Types.ObjectId;
        status: 'In Progress' | 'Completed' | 'Cancel';
        createdAt: Date;
    }>;
    ownedTasks: Types.ObjectId[];
}

export interface IUserDocument extends IUser, Document {}

const UserSchema = new mongoose.Schema<IUserDocument>(
    {
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            maxlength: [255, 'First name cannot be longer than 255 characters'],
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            maxlength: [255, 'Last name cannot be longer than 255 characters'],
        },
        email: {
            type: String,
            unique: true,
            required: [true, 'Email is required'],
            validate: {
                validator: function (v: string) {
                    return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
                },
                message: 'Invalid email format',
            },
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password cannot be shorter than 8 characters'],
            select: false,
        },
        phoneNumber: {
            type: String,
            validate: {
                validator: function (v: string) {
                    return /^[0-9]{10}$/.test(v);
                },
                message: 'Invalid phone number format',
            },
        },
        description: {
            type: String,
            validate: {
                validator: function (value: string) {
                    return value.length <= 1000;
                },
                message: 'Description must not exceed 1000 characters',
            },
            set: (value: string) => sanitize(value), // Sanitize the description before saving (prevent malicious code injection)
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
        bankId: {
            type: String,
            validate: {
                validator: function (v: string) {
                    try {
                        const id: number = parseInt(v);
                        return id >= 0 && id <= 10;
                    } catch (error) {
                        return false;
                    }
                },
                message: 'bankId must be a string of number between 0-10.',
            },
        },
        bankAccName: {
            type: String,
        },
        bankAccNo: {
            type: String,
            validate: {
                validator: function (this: IUser, v: string) {
                    return /^[0-9]{10}$/.test(v);
                },
                message:
                    'Bank account number must be string with length 10 and all are number',
            },
        },
        applications: {
            type: [
                {
                    taskId: {
                        type: Schema.Types.ObjectId,
                        required: [true, 'TaskId for application is required'],
                        ref: 'Task',
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
        tasks: {
            type: [
                {
                    taskId: {
                        type: Schema.Types.ObjectId,
                        required: [true, 'TaskId for work is required'],
                        ref: 'Task',
                    },
                    status: {
                        type: String,
                        enum: ['In Progress', 'Completed', 'Cancel'],
                        required: [true, 'Task status is required'],
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
        ownedTasks: {
            type: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
            default: [],
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    },
);

UserSchema.methods.toJSON = function () {
    const userObject: any = this.toObject();
    delete userObject.password;
    return userObject;
};

UserSchema.pre('save', async function (next) {
    const salt = await genSalt(10);
    const hashedPassword = await hash(this.password, salt);
    this.password = hashedPassword;
    next();
});

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);
