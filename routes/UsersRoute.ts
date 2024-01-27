import express from 'express';
import {createUser, getUserInformation, deleteUser, isPhoneNumberExist, updateUserProfile} from '../controllers/UsersController';

const router = express.Router();

router.route('/').post(createUser);
router.route('/:obj_id').get(getUserInformation);
router.route('/delete/:obj_id').delete(deleteUser);
router.route('/update/:obj_id').patch(updateUserProfile);
router.route('/isPhoneNumberExist/:phoneNo').get(isPhoneNumberExist);

export default router;