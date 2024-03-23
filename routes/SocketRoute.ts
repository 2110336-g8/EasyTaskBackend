import { Socket, Server as SocketIOServer } from 'socket.io';
import Container from 'typedi';
import { MessagesController } from '../controllers/MessagesController';
import AuthMiddleware from '../middlewares/AuthMiddleware';

const messagesController = Container.get(MessagesController);
const authMiddleware = Container.get(AuthMiddleware);

export default function socketRouter(io: SocketIOServer) {
    io.of('/chats')
        .use(authMiddleware.validateTokenSocket)
        .on('connection', (socket: Socket) => {
            console.log('A user connected');
            messagesController.respond(io, socket);
        });
}
