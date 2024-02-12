import express from 'express';
import UsersController from '../controllers/UsersController';
import Container from 'typedi';

const router = express.Router();

const usersController: UsersController = Container.get(UsersController);

// router.route('/').post(usersController.createUser);

router
    .route('/:id')
    .get(usersController.getUserbyId)
    .patch(usersController.updateUser);

router
    .route('/:id/profile-image')
    .get(usersController.getProfileImage)
    .post(usersController.uploadProfileImage)
    .delete(usersController.deleteProfileImage);

export default router;
