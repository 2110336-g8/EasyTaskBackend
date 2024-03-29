import { Server } from 'socket.io';
import { Inject, Service } from 'typedi';
import ExpressApp from './express';
import socketRouter from '../routes/SocketRoute';

@Service()
export default class SocketIO {
    private expressApp: ExpressApp;
    private io: Server | undefined;

    constructor(@Inject(() => ExpressApp) expressApp: ExpressApp) {
        this.expressApp = expressApp;
    }

    start() {
        socketRouter(this.getSocketIO());
    }

    getSocketIO() {
        if (!this.io) {
            this.io = new Server(this.expressApp.getHttpServer(), {
                cors: this.expressApp.getCorsOptions(),
            });
        }
        return this.io;
    }
}
