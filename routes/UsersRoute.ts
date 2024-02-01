import express from 'express';
import UsersController from '../controllers/UsersController';
import Container from 'typedi';

const router = express.Router();

// Assuming you have already instantiated the `UserService`
const usersController = Container.get(UsersController);

router.route('/').post(usersController.createUser);
router
    .route('/:id')
    .get(usersController.getUserbyId)
    .patch(usersController.updateUser);

export default router;
