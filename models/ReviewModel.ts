import mongoose, { Document, Types, Schema } from 'mongoose';
import { ValidationError } from '../errors/RepoError';

export interface IReview {
    taskId: Types.ObjectId;
    reviewerId: Types.ObjectId;
    revieweeId: Types.ObjectId;
    review: string;
    rating: number;
}

export interface IReviewDocument extends IReview, Document {}

const ReviewSchema = new mongoose.Schema<IReviewDocument>(
    {
        taskId: {
            type: Schema.Types.ObjectId,
            required: [true, 'Task Id is required'],
            ref: 'Task',
        },
        reviewerId: {
            type: Schema.Types.ObjectId,
            required: [true, 'Reviewer Id is required'],
            ref: 'User',
        },
        revieweeId: {
            type: Schema.Types.ObjectId,
            required: [true, 'Reviewee Id is required'],
            ref: 'User',
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    },
);

ReviewSchema.pre('save', function (next) {
    const review = this as IReviewDocument;

    // Check if reviewer Id is equal to reviewee ID
    if (review.reviewerId.equals(review.revieweeId)) {
        return next(
            new ValidationError('Reviewer Id cannot be equal to Reviewee Id'),
        );
    }

    next();
});

export const ReviewModel = mongoose.model<IReviewDocument>(
    'Review',
    ReviewSchema,
);
