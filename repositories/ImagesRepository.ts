import { Inject, Service } from 'typedi';
import {
    CannotCreateImageError,
    CannotGetImageError,
    CannotDeleteImageError,
} from '../errors/ImageError';
import { AWSS3Repository, IAWSS3Repository } from './AWSS3Repository';

import { UsersRepository, IUsersRepository } from './UsersRepo';
import { IUser, IUserDocument } from '../models/UserModel';
import { TasksRepository, ITasksRepository } from './TasksRepo';
import { ITask, ITaskDocument } from '../models/TaskModel';

import dotenv from 'dotenv';
dotenv.config({ path: './config/config.env' });

const IMAGE_EXPIRE_TIME_SECONDS = Number(process.env.IMAGE_EXPIRE_TIME); // Assuming IMAGE_EXPIRE_TIME is defined in your environment variables

export interface IImagesRepository {
    createImage(
        fileBuffer: Buffer,
        mimeType: string,
        imageKey: string,
    ): Promise<boolean>;
    getImageByKey(imageKey: string): Promise<string | null>;
    deleteImage(imageKey: string): Promise<boolean>;
    updateTaskImageUrl(task: ITaskDocument): Promise<ITaskDocument>;
    updateUserImageUrl(user: IUserDocument): Promise<IUserDocument>;
}

@Service()
export class ImagesRepository implements IImagesRepository {
    private awsS3Repository: IAWSS3Repository;
    private usersRepository: IUsersRepository;
    private tasksRepository: ITasksRepository;

    constructor(
        @Inject(() => AWSS3Repository) awsS3Repository: IAWSS3Repository,
        @Inject(() => UsersRepository) usersRepository: IUsersRepository,
        @Inject(() => TasksRepository) tasksRepository: ITasksRepository,
    ) {
        this.awsS3Repository = awsS3Repository;
        this.usersRepository = usersRepository;
        this.tasksRepository = tasksRepository;
    }

    createImage = async (
        fileBuffer: Buffer,
        mimeType: string,
        imageKey: string,
    ): Promise<boolean> => {
        try {
            // Upload the image to AWS S3
            await this.awsS3Repository.uploadFile(
                fileBuffer,
                imageKey,
                mimeType,
            );
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
                await this.awsS3Repository.getObjectSignedUrl(imageKey);
            // const imageUrl = await this.awsS3Service.getObjectSignedUrl('65b541c5f264a6557e00f08c.jpg') ////uncomment this to test
            return imageUrl;
        } catch (error) {
            console.error(error); // Log the error for debugging purposes
            return null;
        }
    };

    deleteImage = async (imageKey: string): Promise<boolean> => {
        try {
            await this.awsS3Repository.deleteFile(imageKey);
            return true;
        } catch (error) {
            throw new CannotDeleteImageError('Can not delete the image');
        }
    };

    //update imageUrl in user and task------------------------------------------

    async updateTaskImageUrl(task: ITaskDocument): Promise<ITaskDocument> {
        let imageUrl: string | undefined | null = task.imageUrl;
        const imageUrlLastUpdateTime = task.imageUrlLastUpdateTime;

        // Logic to update image URLs if needed
        if (
            !imageUrlLastUpdateTime ||
            Date.now() >
                imageUrlLastUpdateTime.getTime() +
                    IMAGE_EXPIRE_TIME_SECONDS * 1000
        ) {
            const imageKey = task.imageKey;
            if (imageKey) {
                const fetchedImageUrl = await this.getImageByKey(imageKey);
                if (fetchedImageUrl) {
                    imageUrl = fetchedImageUrl;
                    // Update imageUrl and imageUrlLastUpdateTime
                    task.imageUrl = fetchedImageUrl;
                    task.imageUrlLastUpdateTime = new Date();
                    // Update the task in the database if necessary
                    await this.tasksRepository.update(task._id, {
                        imageUrl: fetchedImageUrl,
                        imageUrlLastUpdateTime: new Date(),
                    } as ITaskDocument);
                    console.log('Updated task imageUrl successfully');
                }
            }
        }

        return task;
    }

    async updateUserImageUrl(user: IUserDocument): Promise<IUserDocument> {
        let imageUrl: string | undefined | null = user.imageUrl;
        const imageUrlLastUpdateTime = user.imageUrlLastUpdateTime;

        // Logic to update image URLs if needed
        if (
            !imageUrlLastUpdateTime ||
            Date.now() >
                imageUrlLastUpdateTime.getTime() +
                    IMAGE_EXPIRE_TIME_SECONDS * 1000
        ) {
            const imageKey = user.imageKey;
            if (imageKey) {
                const fetchedImageUrl = await this.getImageByKey(imageKey);
                if (fetchedImageUrl) {
                    imageUrl = fetchedImageUrl;
                    // Update imageUrl and imageUrlLastUpdateTime
                    user.imageUrl = fetchedImageUrl;
                    user.imageUrlLastUpdateTime = new Date();
                    // Update the task in the database if necessary
                    await this.usersRepository.update(user._id, {
                        imageUrl: fetchedImageUrl,
                        imageUrlLastUpdateTime: new Date(),
                    } as IUserDocument);
                    console.log('Updated user imageUrl successfully');
                }
            }
        }

        return user;
    }
}
