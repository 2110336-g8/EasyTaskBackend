import express from 'express'
import dotenv from 'dotenv'
import testRouter from './routes/test'

// Load ENVs
dotenv.config({path: `${__dirname}/config/config.env`});

// Parameters
const app = express();
const environment = process.env.ENVIRONMENT;
const isDevelopment = environment === 'development';
const port: number = isDevelopment ?
    (process.env.BACK_PORT_DEV === undefined ? 5001 : parseInt(process.env.BACK_PORT_DEV, 10)) :
    (process.env.BACK_PORT === undefined ? 5000 : parseInt(process.env.BACK_PORT, 10));
const hostname: string = isDevelopment ?
    (process.env.BACK_HOSTNAME_DEV === undefined ? 'localhost' : process.env.BACK_HOSTNAME_DEV) :
    (process.env.BACK_HOSTNAME === undefined ? 'localhost' : process.env.BACK_HOSTNAME);

app.use('/v1/test', testRouter);

const server = app.listen(port, function () {
    console.log(`Server is running on http://localhost:${port}`)
});

process.on('unhandledRejection', function (error, promise) {
    console.log(`Error: ${error}`)
    server.close(() => process.exit(1))
});
