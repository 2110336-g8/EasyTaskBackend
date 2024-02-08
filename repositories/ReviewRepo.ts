import { IReview, IReviewDocument, ReviewModel } from '../models/ReviewModel';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { Service } from 'typedi';

export interface IReviewsRepository extends IRepository<IReview> {}

@Service()
export class ReviewsRepository
    extends BaseMongooseRepository<IReview>
    implements IReviewsRepository
{
    constructor() {
        super(ReviewModel);
    }
}
