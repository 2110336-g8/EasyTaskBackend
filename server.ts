import 'reflect-metadata';
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import http from 'http'; // Import http module for creating HTTP server
import Container from 'typedi';
import { Server as SocketIOServer } from 'socket.io';
import userRouter from './routes/UsersRoute';
import connectDB from './config/db';
import authRouter from './routes/AuthRoute';
import taskRouter from './routes/TasksRoute';
import bankRouter from './routes/BankRoute';
import messagesRouter from './routes/MessagesRoute';
import socketRouter from './routes/SocketRoute';
import AuthMiddleware from './middlewares/AuthMiddleware';
import swaggerDocs from 'swagger';

// Load ENVs
dotenv.config({ path: `${__dirname}/config/config.env` });

// Connect DB
connectDB().then(successful => {
    if (process.env.ENVIRONMENT == 'production' && !successful) {
        process.exit(0);
    }
});

// Parameters
const app = express();
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

const corsOption = {
    origin: '*',
    credentials: true,
};

const authMiddleware = Container.get(AuthMiddleware);

app.use(express.json());
app.use(bodyParser.raw({ type: ['image/jpeg', 'image/png'], limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(cors(corsOption));

app.use('/v1/auth', authRouter);
app.use('/v1/banks', bankRouter);
app.use('/v1/users', authMiddleware.validateToken, userRouter);
app.use('/v1/tasks', authMiddleware.validateToken, taskRouter);
app.use('/v1/messages', authMiddleware.validateToken, messagesRouter);

// Other paths are invalid, res 404
app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
        error: 'Path Not Found',
    });
});

// Create an HTTP server instance
const httpServer = http.createServer(app);

// Pass the HTTP server instance to Socket.IO
const io = new SocketIOServer(httpServer, {
    cors: corsOption,
});
socketRouter(io);
// Schedule
require('./config/schedule');

const server = httpServer.listen(backPort, function () {
    console.log(`Server is running on ${backHostname}:${backPort}`);
});
swaggerDocs(app, backPort);
process.on('unhandledRejection', function (error, promise) {
    console.log(`Error: ${error}`);
    server.close(() => process.exit(1));
});
