import { Service } from 'typedi';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { IImageDocument, ImageModel } from '../models/ImageModel';

export interface IImageRepository extends IRepository<IImageDocument> {}

@Service()
export class ImageRepository
    extends BaseMongooseRepository<IImageDocument>
    implements IImageRepository
{
    constructor() {
        super(ImageModel);
    }
}
