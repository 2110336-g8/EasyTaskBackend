import mongoose, { Document } from 'mongoose';

export interface IImage {
    ownerId: string; // object id Reference to either User or Task
    imageKey: string;
    purpose: string; // User or task
}

export interface IImageDocument extends IImage, Document {}

const ImageSchema = new mongoose.Schema<IImageDocument>(
    {
        ownerId: {
            type: String,
            required: [true, 'Owner is required'],
            ref: 'User or Task',
        },
        imageKey: {
            type: String,
            required: [true, 'Image key is required'],
        },
        purpose: {
            type: String,
            required: [true, 'Purpose is required'],
        },
    },
    {
        timestamps: { createdAt: 'createdAt' },
    },
);

export const ImageModel = mongoose.model<IImageDocument>('Image', ImageSchema);
