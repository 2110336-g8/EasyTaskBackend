import express from 'express';
import UsersController from '../controllers/UsersController';
import Container from 'typedi';
import { UserMiddleware } from '../middlewares/UserMiddleware';

const router = express.Router();

const usersController: UsersController = Container.get(UsersController);
const userMiddleware = Container.get(UserMiddleware);

// router.route('/').post(usersController.createUser);

router
    .route('/:id')
    .get(usersController.getUserbyId)
    .patch(userMiddleware.validateUpdateUserData, usersController.updateUser);

router
    .route('/:id/profile-image')
    .get(usersController.getProfileImage)
    .post(usersController.uploadProfileImage)
    .delete(usersController.deleteProfileImage);

export default router;
