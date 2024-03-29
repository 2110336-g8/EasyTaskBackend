import express, { Application, NextFunction, Request, Response } from 'express';
import http from 'http';
import Container, { Service } from 'typedi';
import AuthMiddleware from '../middlewares/AuthMiddleware';
import cors, { CorsOptions } from 'cors';
import bodyParser from 'body-parser';
import userRouter from '../routes/UsersRoute';
import authRouter from '../routes/AuthRoute';
import taskRouter from '../routes/TasksRoute';
import bankRouter from '../routes/BankRoute';
import messagesRouter from '../routes/MessagesRoute';
import socketRouter from '../routes/SocketRoute';
import { Server } from 'socket.io';

@Service()
export default class ExpressApp {
    private app: Application;
    private httpServer: any;
    private corsOptions: CorsOptions;

    constructor() {
        this.app = express();
        this.httpServer = http.createServer(this.app);
        // To add later!!!
        // const allowedOrigins: string[] = ['*'];
        //
        // const corsOption = {
        //     origin: function (
        //         requestOrigin: string | undefined,
        //         callback: (err: Error | null, origin?: string) => void,
        //     ) {
        //         if (allowedOrigins.includes(<string>requestOrigin) || !requestOrigin) {
        //             callback(null, requestOrigin);
        //         } else {
        //             callback(new Error('Not allowed by CORS'));
        //         }
        //     },
        //     credentials: true,
        //     optionsSuccessStatus: 200,
        // };
        this.corsOptions = {
            origin: '*',
            credentials: true,
        };
        this.setUp();
    }

    private setUp() {
        const authMiddleware = Container.get(AuthMiddleware);

        const app = this.app;
        app.use(express.json());
        app.use(
            bodyParser.raw({ type: ['image/jpeg', 'image/png'], limit: '5mb' }),
        );
        app.use(express.urlencoded({ extended: true }));
        app.use(cors(this.corsOptions));

        const io = new Server(this.getHttpServer(), {
            cors: this.getCorsOptions(),
        });
        socketRouter(io);
        app.use((req: Request, res: Response, next: NextFunction) => {
            res.io = io;
            next();
        });
        app.use('/ping', (req: Request, res: Response) => {
            res.status(200).json({
                message: 'HTTP ping successful!',
            });
        });
        app.use('/v1/auth', authRouter);
        app.use('/v1/banks', bankRouter);
        app.use('/v1/users', authMiddleware.validateToken, userRouter);
        app.use('/v1/tasks', authMiddleware.validateToken, taskRouter);
        app.use('/v1/messages', authMiddleware.validateToken, messagesRouter);
        app.use('*', (req: Request, res: Response) => {
            res.status(404).json({
                error: `Path Not Found for ${req.url}`,
            });
        });
    }

    start() {
        const environment = process.env.ENVIRONMENT;
        const isDevelopment = environment === 'development';
        const backHostname: string = process.env.BACK_HOSTNAME
            ? process.env.BACK_HOSTNAME
            : 'localhost';
        const backPort: number = process.env.BACK_PORT
            ? parseInt(process.env.BACK_PORT)
            : 5001;
        const frontHostname: string = process.env.FRONT_HOSTNAME
            ? process.env.FRONT_HOSTNAME
            : 'localhost';
        const frontPort: number = process.env.FRONT_PORT
            ? parseInt(process.env.FRONT_PORT)
            : 8081;
        const server = this.httpServer.listen(backPort, () => {
            console.log(
                `Server is running on ${backHostname}, port ${backPort}`,
            );
        });
        process.on('unhandledRejection', function (error, promise) {
            console.log(`Error: ${error}`);
            server.close(() => process.exit(1));
        });
    }

    getHttpServer() {
        return this.httpServer;
    }

    getCorsOptions() {
        return this.corsOptions;
    }
}
