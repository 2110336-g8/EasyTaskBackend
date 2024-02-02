import mongoose, { Document, ObjectId, Types } from 'mongoose';
import { compare, genSalt, hash } from 'bcrypt';

export interface IUser {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    imageKey?: string;
    bankId?: ObjectId;
    bankAccNo?: string;
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
        imageKey: {
            type: String,
        },
        bankId: {
            type: Types.ObjectId,
        },
        bankAccNo: {
            type: String,
            validate: {
                validator: function (v: string) {
                    return /^[0-9]{10}$/.test(v);
                },
                message:
                    'Bank account number need to be all number with length 10',
            },
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
