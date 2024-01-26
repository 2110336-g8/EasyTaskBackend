import mongoose, { Document, ObjectId, Types } from "mongoose";

export interface User {
    userId: ObjectId
    firstName: string;
    lastName: string;
    photoURL?: string;
    gender: 'M' | 'F' | 'O';
    phoneNumber: string;
    citizenId?: string;
    verifyFlag: boolean;
    bankId?: string;
    bankAccountNo?: string;
}

export interface UserDocument extends User, Document {}

const UserSchema = new mongoose.Schema<UserDocument>({
    userId: {
        type: Types.ObjectId
    },
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
    photoURL: {
        type: String,
        validate: {
            validator: function (v: string) {
                // Add custom validation for URL format
                return /^(ftp|http|https):\/\/[^ "]+$/.test(v);
            },
            message: 'Invalid URL format for photo',
        },
    },
    gender: {
        type: String,
        enum: ['M', 'F', 'O'],
        required: [true, 'Gender is required']
    },
    phoneNumber: {
        type: String,
        unique: true,
        required: [true, 'Phone number is required'],
        // You might want to add additional validation for phone numbers
        // Example: validate: /^[0-9]{10}$/, // 10 digits only
    },
    citizenId: {
        type: String,
        unique: true,
        maxlength: [13, 'Citizen id cannot be longer than 13 characters'],
        validate: {
            validator: function (v: string) {
                // Add custom validation for URL format
                return /d{13}/.test(v);
            },
            message: 'Invalid citizen ID format',
        },
    },
    verifyFlag: {
        type: Boolean,
        required: [true, 'Verify flag is required']
    },
    bankId: {
        type: Types.ObjectId,
    },
    bankAccountNo: {
        type: String,
        maxlength: [10, 'Bank account cannot be longer than 10 characters']
    }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
});

export const UserModel = mongoose.model<UserDocument>('user', UserSchema);

