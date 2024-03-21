import express from 'express';
import Container from 'typedi';
import { MessagesController } from '../controllers/MessagesController';

const router = express.Router();
const messagesController = Container.get(MessagesController);

router
    .route('/:id')
    .get(messagesController.getMessageHistory)
    .post(messagesController.sendUserMessage);

export default router;
