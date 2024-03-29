import { Request, Response } from 'express';
import {
    IUsersService,
    UsersService as UsersService,
} from '../services/UsersService';
import { IUser } from '../models/UserModel';
import { ValidationError } from '../errors/RepoError';
import { Service, Inject } from 'typedi';
import sharp from 'sharp';
import { genSalt, hash } from 'bcrypt';

@Service()
class UsersController {
    private usersService: IUsersService;

    constructor(@Inject(() => UsersService) userService: IUsersService) {
        this.usersService = userService;
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
            const user: IUser | null = await this.usersService.getUserById(id);

            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            res.status(200).json({ user });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    updateUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = req.params.id;
            const data = req.body;

            if (data.password) {
                res.status(403).json({ error: 'Cannot update password' });
                return;
            }

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
            const email: string = req.user.email as string;
            const currentPassword: string = req.body.currentPassword as string;

            const salt = await genSalt(10);
            const hashedPassword: string = await hash(
                req.body.newPassword as string,
                salt,
            );
            const data: IUser = { password: hashedPassword } as IUser;

            const user = await this.usersService.updatePassword(
                id,
                email,
                data,
                currentPassword,
            );
            if (!user) {
                res.status(401).json({
                    error: 'Unauthorized',
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

    deleteUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = req.params.id;
            const email: string = req.user.email as string;
            const password = req.body.password;

            const user = await this.usersService.deleteUser(
                id,
                password,
                email,
            );
            if (!user) {
                res.status(401).json({
                    error: 'Unauthorized',
                });
                return;
            }
            res.status(200).json({ user: user.toJSON() });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
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
            const imageUrl = await this.usersService.getUserProfileImage(id);

            // If the image URL exists, redirect to the image
            if (imageUrl) {
                res.status(200).json(imageUrl);
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
                // console.log(fileExtension);
                // Generate the imageKey using the userId and fileExtension
                const key = `${userId}.${fileExtension}`;
                console.log(key);

                await this.usersService.updateUserProfileImage(
                    userId,
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
            const userId = req.params.id;
            const user = await this.usersService.getUserById(userId);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            // Delete the user's profile image
            if (!user.imageKey) {
                res.status(200).json({
                    message: 'There is no Profile image',
                });
            } else {
                await this.usersService.deleteUserProfileImage(
                    userId,
                    user.imageKey,
                );

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
