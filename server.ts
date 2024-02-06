import 'reflect-metadata';
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import userRouter from './routes/UsersRoute';
import connectDB from './config/db';
import authRouter from './routes/AuthRoute';
import taskRouter from './routes/TasksRoute';
import cors from 'cors';
import bodyParser from 'body-parser';
import bankRouter from './routes/BankRoute';

// Load ENVs
dotenv.config({ path: `${__dirname}/config/config.env` });

// Parameters
const app = express();
const environment = process.env.ENVIRONMENT;
const isDevelopment = environment === 'development';
const backPort: number = isDevelopment
    ? process.env.BACK_PORT_DEV === undefined
        ? 5001
        : parseInt(process.env.BACK_PORT_DEV, 10)
    : process.env.BACK_PORT === undefined
      ? 5000
      : parseInt(process.env.BACK_PORT, 10);
const backHostname: string = isDevelopment
    ? process.env.BACK_HOSTNAME_DEV === undefined
        ? 'localhost'
        : process.env.BACK_HOSTNAME_DEV
    : process.env.BACK_HOSTNAME === undefined
      ? 'localhost'
      : process.env.BACK_HOSTNAME;
const frontPort: number = isDevelopment
    ? process.env.FRONT_PORT_DEV === undefined
        ? 8081
        : parseInt(process.env.FRONT_PORT_DEV, 10)
    : process.env.FRONT_PORT === undefined
      ? 8000
      : parseInt(process.env.FRONT_PORT, 10);
const frontHostname: string = isDevelopment
    ? process.env.FRONT_HOSTNAME_DEV === undefined
        ? 'localhost'
        : process.env.FRONT_HOSTNAME_DEV
    : process.env.FRONT_HOSTNAME === undefined
      ? 'localhost'
      : process.env.FRONT_HOSTNAME;

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

connectDB().then(function (r: any) {
    console.log('DB Connected!');
});

app.use(express.json());
app.use(bodyParser.raw({ type: ['image/jpeg', 'image/png'], limit: '5mb' }));

app.use(cors(corsOption));

app.use('/v1/users', userRouter);
app.use('/v1/auth', authRouter);
app.use('/v1/tasks', taskRouter);
app.use('/v1/banks', bankRouter);

// Other paths are invalid, res 404
app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
        error: 'Path Not Found',
    });
});

require('./config/schedule');

const server = app.listen(backPort, function () {
    console.log(`Server is running on ${backHostname}:${backPort}`);
});

process.on('unhandledRejection', function (error, promise) {
    console.log(`Error: ${error}`);
    server.close(() => process.exit(1));
});
