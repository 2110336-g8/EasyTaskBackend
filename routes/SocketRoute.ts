import { Server, Socket, Server as SocketIOServer } from 'socket.io';
import Container from 'typedi';
import { MessagesController } from '../controllers/MessagesController';
import AuthMiddleware from '../middlewares/AuthMiddleware';

const messagesController = Container.get(MessagesController);
const authMiddleware = Container.get(AuthMiddleware);

export default function socketRouter(io: Server) {
    io.of('/messages')
        .use(authMiddleware.validateTokenSocket)
        .on('connection', (socket: Socket) => {
            console.log(`${socket.data.user._id} connected to socket`);
            messagesController.respond(io, socket);
        })
        .on('disconnect', (socket: Socket) => {
            console.log(`${socket.data.user._id} disconnected from socket`);
        });
}
