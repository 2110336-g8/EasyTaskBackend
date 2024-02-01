import { Service } from 'typedi'
import { BaseMongooseRepository } from './BaseRepo'
import { IImageDocument, ImageModel } from '../models/ImageModel'

@Service()
export class ImageRepository extends BaseMongooseRepository<IImageDocument> {
    constructor() {
        super(ImageModel)
    }
}
