import express from 'express'
import dotenv from 'dotenv'
import testRouter from './routes/test'

// Load ENVs
dotenv.config({path: './config/config.env'});

// Parameters
const app = express();
const environment = process.env.NODE_ENV;
const isDevelopment = environment === 'development';
const port: number = isDevelopment ?
    (process.env.PORT_DEV === undefined ? 5001 : parseInt(process.env.PORT_DEV, 10)) :
    (process.env.PORT === undefined ? 5000 : parseInt(process.env.PORT, 10));
const hostname: string = isDevelopment ?
    (process.env.HOSTNAME_DEV === undefined ? 'localhost' : process.env.HOSTNAME_DEV) :
    (process.env.HOSTNAME === undefined ? 'localhost' : process.env.HOSTNAME);

app.use('/v1/test', testRouter);

const server = app.listen(port, hostname, function () {
    console.log(`Server is running on http://localhost:${port}`)
});

process.on('unhandledRejection', function (error, promise) {
    console.log(`Error: ${error}`)
    server.close(() => process.exit(1))
});
