import { Inject, Service } from 'typedi'
import { ImageRepository } from '../repositories/ImageRepo'
import { ImageModel, IImageDocument } from '../models/ImageModel'
import { CannotCreateImageError , CannotGetImageError, CannotDeleteImageError} from '../errors/ImageError'
import AWSS3Service from './AWSS3Service'

@Service()
export class ImageService {
    private imageRepository: ImageRepository;

    constructor(
        @Inject() imageRepository: ImageRepository,
    ) {
        this.imageRepository = imageRepository;
    }


    async createImage(ownerId: string, fileBuffer: Buffer, mimeType: string, imageKey: string, purpose: string): Promise<IImageDocument> {
        try {
            // Upload the image to AWS S3
            await AWSS3Service.uploadFile(fileBuffer, ownerId, mimeType);
            // Save image details to the database
            const imageDoc = await this.imageRepository.create({
                ownerId: ownerId,
                imageKey: imageKey,
                purpose : purpose,
                createdAt: new Date(),
            } as IImageDocument);

            return imageDoc;
        } catch (error) {
            throw new CannotCreateImageError(
                'There is the error when creating image',
            )
        }
    }
    

    async getImageByOwnerId(ownerId: string): Promise<string | null> {
        try {
            // Find the image document based on the ownerId using findById
            const imageDoc: IImageDocument | null = await ImageModel.findOne({ownerId});
    
            if (!imageDoc) {
                throw new Error('Image not found for the given ownerId');
            }
    
            // Extract imageKey from the found image document
            const key = imageDoc.imageKey;
            const imageUrl = await AWSS3Service.getObjectSignedUrl(key)
            // const imageUrl = await AWSS3Service.getObjectSignedUrl('65b541c5f264a6557e00f08c.jpg') ////uncomment this to test
            return imageUrl;
        } catch (error) {
            throw new CannotGetImageError('Can not get the image');
        }
    }    

    async deleteImage(ownerId: string): Promise<boolean> {
        try {
            // Find the image document based on the ownerId
            const imageDoc: IImageDocument | null = await ImageModel.findOne({ ownerId });

            if (!imageDoc) {
                throw new Error('Image not found for the given ownerId');
            }

            // Extract imageKey from the found image document
            const key = imageDoc.imageKey;
            // Delete image from AWS S3
            await AWSS3Service.deleteFile(key);
    
            // Delete image details from the database
            const success = await this.imageRepository.deleteOne(imageDoc.id);
            return success;
        } catch (error) {
            throw new CannotDeleteImageError('Can not delete the image');
        }
    }

}