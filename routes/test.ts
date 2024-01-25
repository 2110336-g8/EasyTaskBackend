import express from 'express';
import { getHelloWorld } from '../controllers/test';

const router = express.Router();

router.route('/').get(getHelloWorld);

export default router;