import { Inject, Service } from 'typedi';
import { IImageRepository, ImageRepository } from '../repositories/ImageRepo';
import { ImageModel, IImageDocument } from '../models/ImageModel';
import {
    CannotCreateImageError,
    CannotGetImageError,
    CannotDeleteImageError,
} from '../errors/ImageError';
import { AWSS3Service, IBucketService } from './AWSS3Service';
import { IRepository } from '../repositories/BaseRepo';
@Service()
export class ImageService {
    private imageRepository: IRepository<IImageDocument>;
    private awsS3Service: IBucketService;

    constructor(
        @Inject(() => ImageRepository)
        imageRepository: IRepository<IImageDocument>,
        @Inject(() => AWSS3Service) awsS3Service: IBucketService,
    ) {
        this.imageRepository = imageRepository;
        this.awsS3Service = awsS3Service;
    }

    async createImage(
        ownerId: string,
        fileBuffer: Buffer,
        mimeType: string,
        imageKey: string,
        purpose: string,
    ): Promise<IImageDocument> {
        try {
            // Upload the image to AWS S3
            await this.awsS3Service.uploadFile(fileBuffer, imageKey, mimeType);
            // Save image details to the database
            const imageDoc = await this.imageRepository.create({
                ownerId: ownerId,
                imageKey: imageKey,
                purpose: purpose,
                createdAt: new Date(),
            } as IImageDocument);

            return imageDoc;
        } catch (error) {
            throw new CannotCreateImageError(
                'There is the error when creating image',
            );
        }
    }

    async getImageByOwnerId(ownerId: string): Promise<string | null> {
        try {
            // Find the image document based on the ownerId using findById
            const imageDoc: IImageDocument | null = await ImageModel.findOne({
                ownerId,
            });

            if (!imageDoc) {
                throw new Error('Image not found for the given ownerId');
            }
            const key = imageDoc.imageKey;
            console.log(key);
            if( key === null || key === ""){
                console.log('There is no profile image for this user');
                throw new CannotGetImageError('Can not get the image');
            }
            const imageUrl = await this.awsS3Service.getObjectSignedUrl(key)

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
