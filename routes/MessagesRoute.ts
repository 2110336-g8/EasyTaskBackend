import express from 'express';
import Container from 'typedi';
import { MessagesController } from '../controllers/MessagesController';
import MessagesMiddleware from '../middlewares/MessagesMiddleware';

const router = express.Router();
const messagesController = Container.get(MessagesController);
const messagesMiddleware = Container.get(MessagesMiddleware);

router.route('/').get(messagesController.getMessageRoomsList);

router
    .route('/:id/info')
    .get(
        messagesMiddleware.authorizeUserFetchMessages,
        messagesController.getMessageRoomInfo,
    );
router
    .route('/:id/history')
    .get(
        messagesMiddleware.authorizeUserFetchMessages,
        messagesController.getMessageHistory,
    );

export default router;
