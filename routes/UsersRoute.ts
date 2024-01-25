import express from 'express';
import { createUser } from '../controllers/UsersController';

const router = express.Router();

router.route('/').post(createUser);

export default router;