import express from 'express'
import dotenv from 'dotenv'
import testRouter from './routes/test'

// Load ENVs
dotenv.config({path: './config/config.env'})

const app = express();
const port: number = process.env.PORT === undefined ? 5000 : parseInt(process.env.PORT, 10);

app.use('/v1/test', testRouter)

const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
});

process.on('unhandledRejection', (error, promise) => {
    console.log(`Error: ${error}`)
    server.close(() => process.exit(1))
});
