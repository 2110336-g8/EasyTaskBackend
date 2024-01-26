import express from 'express';
import { createUser } from '../controllers/UsersController';
import { updateUserProfile } from '../controllers/UsersController';


const router = express.Router();

router.route('/').post(createUser);
router.route('/update/:obj_id').patch(updateUserProfile);

export default router;