import mongoose, { Document, ObjectId } from "mongoose";

export interface User {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    photoURL?: string;
    gender: 'M' | 'F' | 'O';
}

export interface UserDocument extends User, Document {}

const UserSchema = new mongoose.Schema<UserDocument>({
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
    phoneNumber: {
        type: String,
        unique: true,
        required: [true, 'Phone number is required'],
        // You might want to add additional validation for phone numbers
        // Example: validate: /^[0-9]{10}$/, // 10 digits only
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
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
});

export const UserModel = mongoose.model<UserDocument>('user', UserSchema);

