import { Service } from 'typedi';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import { IImage, IImageDocument, ImageModel } from '../models/ImageModel';

export interface IImageRepository extends IRepository<IImage> {}

@Service()
export class ImageRepository
    extends BaseMongooseRepository<IImage>
    implements IImageRepository
{
    constructor() {
        super(ImageModel);
    }
}
