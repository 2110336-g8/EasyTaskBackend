import express from 'express';
import dotenv from 'dotenv';
import testRouter from './routes/test';
import userRouter from './routes/UsersRoute';
import authRouter from './routes/AuthRoute';

// Load ENVs
dotenv.config({path: `${__dirname}/config/config.env`});

// Parameters
const apiPrefix = '/v1';
const app = express();
const environment = process.env.ENVIRONMENT;
const isDevelopment = environment === 'development';
const port: number = isDevelopment ?
    (process.env.BACK_PORT_DEV === undefined ? 5001 : parseInt(process.env.BACK_PORT_DEV, 10)) :
    (process.env.BACK_PORT === undefined ? 5000 : parseInt(process.env.BACK_PORT, 10));
const hostname: string = isDevelopment ?
    (process.env.BACK_HOSTNAME_DEV === undefined ? 'localhost' : process.env.BACK_HOSTNAME_DEV) :
    (process.env.BACK_HOSTNAME === undefined ? 'localhost' : process.env.BACK_HOSTNAME);

app.use(express.json());
app.use(`${apiPrefix}/test`, testRouter);
app.use(`${apiPrefix}/users`, userRouter);
app.use(`${apiPrefix}/auth`, authRouter);

const server = app.listen(port, function () {
    console.log(`Server is running on http://localhost:${port}`)
});

process.on('unhandledRejection', function (error, promise) {
    console.log(`Error: ${error}`)
    server.close(() => process.exit(1))
});
