import { Inject, Service } from 'typedi';
import { IImageRepository, ImageRepository } from '../repositories/ImageRepo';
import { ImageModel, IImageDocument, IImage } from '../models/ImageModel';
import {
    CannotCreateImageError,
    CannotGetImageError,
    CannotDeleteImageError,
} from '../errors/ImageError';
import { AWSS3Service, IBucketService } from './AWSS3Service';
import { IRepository } from '../repositories/BaseRepo';
@Service()
export class ImageService {
    private imageRepository: IRepository<IImage>;
    private awsS3Service: IBucketService;

    constructor(
        @Inject(() => ImageRepository)
        imageRepository: IRepository<IImage>,
        @Inject(() => AWSS3Service) awsS3Service: IBucketService,
    ) {
        this.imageRepository = imageRepository;
        this.awsS3Service = awsS3Service;
    }

    async createImage(
        fileBuffer: Buffer,
        mimeType: string,
        imageKey: string,
    ): Promise<boolean> {
        try {
            // Upload the image to AWS S3
            await this.awsS3Service.uploadFile(fileBuffer, imageKey, mimeType);
            return true;
        } catch (error) {
            throw new CannotCreateImageError(
                'There is the error when creating image',
            );
        }
    }

    async getImageByKey(imageKey: string): Promise<string | null> {
        try {
            if (imageKey === null || imageKey === '') {
                console.log('There is no profile image for this user');
                throw new CannotGetImageError('Can not get the image');
            }
            const imageUrl =
                await this.awsS3Service.getObjectSignedUrl(imageKey);
            // const imageUrl = await this.awsS3Service.getObjectSignedUrl('65b541c5f264a6557e00f08c.jpg') ////uncomment this to test
            return imageUrl;
        } catch (error) {
            console.error(error); // Log the error for debugging purposes
            return null;
        }
    }

    async deleteImage(ownerId: string): Promise<boolean> {
        try {
            // Find the image document based on the ownerId
            const imageDoc: IImageDocument | null = await ImageModel.findOne({
                ownerId,
            });

            if (!imageDoc) {
                throw new Error('Image not found for the given ownerId');
            }

            // Extract imageKey from the found image document
            const key = imageDoc.imageKey;
            // Delete image from AWS S3
            await this.awsS3Service.deleteFile(key);

            // Delete image details from the database
            console.log(imageDoc.id);
            const success = await this.imageRepository.deleteOne(imageDoc.id);
            return success;
        } catch (error) {
            throw new CannotDeleteImageError('Can not delete the image');
        }
    }
}
