import express from 'express';
import {createUser, isPhoneNumberExist, updateUserProfile} from '../controllers/UsersController';

const router = express.Router();

router.route('/').post(createUser);
router.route('/update/:obj_id').patch(updateUserProfile);
router.route('/isPhoneNumberExist/:phoneNo').get(isPhoneNumberExist);

export default router;