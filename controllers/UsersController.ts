import { Request, Response } from 'express';
import {
    IUsersService,
    UsersService as UsersService,
} from '../services/UsersService';
import { IUserDocument } from '../models/UserModel';
import { ValidationError } from '../errors/RepoError';
import { Service, Inject } from 'typedi';
import { CannotCreateUserError } from '../errors/UsersError';
import { ImageService } from '../services/ImageService';
import sharp from 'sharp';
@Service()
class UsersController {
    private usersService: IUsersService;
    private imageService: ImageService;

    constructor(@Inject(() => UsersService) userService: IUsersService, @Inject() imageService: ImageService) {
        this.usersService = userService;
        this.imageService = imageService;
    }
    // TO BE DELETE
    createUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const data = req.body;
            const user = await this.usersService.createUser(data);
            res.status(201).json(user);
        } catch (error) {
            if (error instanceof CannotCreateUserError) {
                res.status(400).json({
                    error: error.name,
                    detalis: error.message,
                });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    };

    getUserbyId = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = req.params.id;
            const user = await this.usersService.getUserById(id);
            res.status(200).json(user);
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
            }
            res.status(200).json(user);
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
    }
    // image ---------------------------------------------------------------------------------
    getProfileImage = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.params.id;
            // Retrieve the user's profile image URL from your database
            console.log('get image by owner id')
            const userProfileImageUrl = await this.imageService.getImageByOwnerId(userId);

            // If the image URL exists, redirect to the image
            if (userProfileImageUrl) {
                res.redirect(userProfileImageUrl);
            } else {
                res.status(404).json({ error: 'Profile image not found' });
            }
        } catch (error) {
            console.log('cannot get by owner id')
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    uploadProfileImage = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.params.id;
            const file = req.file;
    
            if (!file) {
                res.status(400).json({ error: 'No file uploaded' });
                return;
            }
            // Use sharp to check if the file is an image
            try {
                await sharp(file.buffer).metadata();
            } catch (error) {
                res.status(400).json({ error: 'Uploaded file is not a valid image' });
                return;
            }
            // Extract the file extension from the originalname (e.g., '.jpg')
            const fileExtension = file.originalname.substring(file.originalname.lastIndexOf('.'));

            // Generate the imageKey using the userId and fileExtension
            const key = `${userId}${fileExtension}`;

            // Update the user's imageKey in your database
            await this.usersService.updateUser(userId,{imageKey: key} as IUserDocument);

            // Upload the file to AWS S3 or your preferred storage
            const uploadedFile = await this.imageService.createImage(userId, file.buffer, file.mimetype, key, 'User-Profile');
    
            res.status(201).json({ message: 'Profile image uploaded successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
    

    deleteProfileImage = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.params.id;

            // Retrieve the user's profile image URL from your database
            const userProfileImageUrl = await this.imageService.getImageByOwnerId(userId);

            if (userProfileImageUrl) {
                // Update the user's profile image URL in your database (optional)
                await this.imageService.deleteImage(userId);

                res.status(200).json({ message: 'Profile image deleted successfully' });
            } else {
                res.status(404).json({ error: 'Profile image not found' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
}

export default UsersController;
