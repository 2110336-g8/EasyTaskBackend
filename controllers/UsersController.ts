import { Request, Response } from 'express';
import {
    IUsersService,
    UsersService as UsersService,
} from '../services/UsersService';
import { ImageService } from '../services/ImageService';
import { IUser, IUserDocument } from '../models/UserModel';
import { ValidationError } from '../errors/RepoError';
import { Service, Inject } from 'typedi';
import { CannotCreateUserError } from '../errors/UsersError';
import sharp from 'sharp';
@Service()
class UsersController {
    private usersService: IUsersService;
    private imageService: ImageService;

    constructor(
        @Inject(() => UsersService) userService: IUsersService,
        @Inject(() => ImageService) imageService: ImageService
    ) {
        this.usersService = userService;
        this.imageService = imageService;
    }
    // TO BE DELETE
    // createUser = async (req: Request, res: Response): Promise<void> => {
    //     try {
    //         const data = req.body;
    //         const user = await this.usersService.createUser(data);
    //         res.status(201).json({ user: user.toJSON() });
    //     } catch (error) {
    //         if (error instanceof CannotCreateUserError) {
    //             res.status(400).json({
    //                 error: error.name,
    //                 details: error.message,
    //             });
    //         } else {
    //             res.status(500).json({ error: 'Internal Server Error' });
    //         }
    //     }
    // };

    getUserbyId = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = req.params.id;
            const user = await this.usersService.getUserById(id);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            res.status(200).json({ user: user.toJSON() });
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    updateUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = req.params.id;
            const data = req.body;
            const user = await this.usersService.updateUser(id, data);
            if (!user) {
                res.status(404).json({
                    error: 'User not found',
                });
                return;
            }
            res.status(200).json({ user: user.toJSON() });
        } catch (error) {
            if (error instanceof ValidationError) {
                res.status(400).json({
                    error: error.name,
                    details: error.message,
                });
            } else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    };

    updatePassword = async (req: Request, res: Response): Promise<void> => {
        try {
            const id: string = req.params.id;
            const data: IUserDocument = { password : req.body.newPassword as string } as IUserDocument;
            const currentPassword: string = req.body.newPassword;
            const user = await this.usersService.updatePassword(id, data, currentPassword);
            if (!user) {
                res.status(404).json({
                    error: 'User not found',
                });
                return;
            }
            res.status(200).json({ user: user.toJSON() });
        } catch (error) {
            if (error instanceof ValidationError) {
                res.status(400).json({
                    error: error.name,
                    details: error.message,
                });
            } else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    };
    
    // image ---------------------------------------------------------------------------------
    getProfileImage = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = req.params.id;
            const user = await this.usersService.getUserById(id);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            const imageKey = user.imageKey;

            if (imageKey) {
                const imageUrl = await this.imageService.getImageByKey(
                    String(imageKey),
                );

                // If the image URL exists, redirect to the image
                if (imageUrl) {
                    res.status(200).json(imageUrl);
                } else {
                    res.status(404).json({ error: 'Profile image not found' });
                }
            } else {
                res.status(404).json({ error: 'Profile image not found' });
            }
        } catch (error) {
            console.log('cannot get by owner id');
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    uploadProfileImage = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.params.id;
            const file = req.body;
            // console.log(req.body);
            if (!file) {
                console.log('no file');
                res.status(400).json({ error: 'No file uploaded' });
                return;
            }
            // Use sharp to check if the file is an image
            try {
                const metadata = await sharp(file).metadata();

                // Extract the file extension from the originalname (e.g., '.jpg')
                const fileExtension = metadata.format!.toLowerCase();
                console.log(fileExtension);

                // Generate the imageKey using the userId and fileExtension
                const key = `${userId}.${fileExtension}`;
                console.log(key);
                // Update the user's imageKey in your database
                await this.usersService.updateUser(userId, {
                    imageKey: key,
                } as IUserDocument);

                // Upload the file to AWS S3 or your preferred storage
                const uploadedFile = await this.imageService.createImage(
                    file.buffer,
                    file.mimeType,
                    key,
                );

                res.status(201).json({
                    message: 'Profile image uploaded successfully',
                });
            } catch (error) {
                res.status(400).json({
                    error: 'Uploaded file is not a valid image',
                });
                return;
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    deleteProfileImage = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = req.params.id;
            const user = await this.usersService.getUserById(id);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            const imageKey = user.imageKey;
            console.log('Image Key:', imageKey);

            if (imageKey === null || imageKey === '') {
                res.status(200).json({
                    message: 'There is no profile image for this user',
                });
            } else {
                await this.imageService.deleteImage(String(imageKey));
                await this.usersService.updateUser(id, {
                    imageKey: '',
                } as IUserDocument);
                res.status(200).json({
                    message: 'Profile image deleted successfully',
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
}

export default UsersController;
