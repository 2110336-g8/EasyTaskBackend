import express from 'express';
import Container from 'typedi';
import { MessagesController } from '../controllers/MessagesController';

const router = express.Router();
const messagesController = Container.get(MessagesController);

router.route('/:id/info').get(messagesController.getMessageRoomInfo);
router.route('/:id/history').get(messagesController.getMessageHistory);

export default router;
