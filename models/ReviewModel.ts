import mongoose, { Document, Types, Schema } from 'mongoose';
import { ValidationError } from '../errors/RepoError';

export interface IReview {
    taskID: Types.ObjectId;
    reviewerID: Types.ObjectId;
    revieweeID: Types.ObjectId;
    review: string;
    rating: number;
}

export interface IReviewDocument extends IReview, Document {}

const ReviewSchema = new mongoose.Schema<IReviewDocument>(
    {
        taskID: {
            type: Schema.Types.ObjectId,
            required: [true, 'Task ID is required'],
            ref: 'Task',
        },
        reviewerID: {
            type: Schema.Types.ObjectId,
            required: [true, 'Reviewer ID is required'],
            ref: 'User',
        },
        revieweeID: {
            type: Schema.Types.ObjectId,
            required: [true, 'Reviewee ID is required'],
            ref: 'User',
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    },
);

ReviewSchema.pre('save', function (next) {
    const review = this as IReviewDocument;

    // Check if reviewer ID is equal to reviewee ID
    if (review.reviewerID.equals(review.revieweeID)) {
        return next(
            new ValidationError('Reviewer ID cannot be equal to Reviewee ID'),
        );
    }

    next();
});

export const ReviewModel = mongoose.model<IReviewDocument>(
    'Review',
    ReviewSchema,
);
