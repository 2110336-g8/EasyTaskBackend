import express from 'express';
import {createUser, isPhoneNumberExist} from '../controllers/UsersController';

const router = express.Router();

router.route('/').post(createUser);
router.route('/isPhoneNumberExist/:phoneNo').get(isPhoneNumberExist);

export default router;