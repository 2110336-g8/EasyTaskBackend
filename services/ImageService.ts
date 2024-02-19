import { Inject, Service } from 'typedi';
import {
    CannotCreateImageError,
    CannotGetImageError,
    CannotDeleteImageError,
} from '../errors/ImageError';
import { AWSS3Service, IBucketService } from './AWSS3Service';
@Service()
export class ImageService {
    private awsS3Service: IBucketService;

    constructor(@Inject(() => AWSS3Service) awsS3Service: IBucketService) {
        this.awsS3Service = awsS3Service;
    }

    createImage = async (
        fileBuffer: Buffer,
        mimeType: string,
        imageKey: string,
    ): Promise<boolean> => {
        try {
            // Upload the image to AWS S3
            await this.awsS3Service.uploadFile(fileBuffer, imageKey, mimeType);
            return true;
        } catch (error) {
            throw new CannotCreateImageError(
                'There is the error when creating image',
            );
        }
    };

    getImageByKey = async (imageKey: string): Promise<string | null> => {
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
    };

    deleteImage = async (imageKey: string): Promise<boolean> => {
        try {
            await this.awsS3Service.deleteFile(imageKey);
            return true;
        } catch (error) {
            throw new CannotDeleteImageError('Can not delete the image');
        }
    };
}
