import express from 'express'
import dotenv from 'dotenv'
import testRouter from './routes/test'

// Load ENVs
dotenv.config({ path: './config/config.env' })

const app = express();
const port = process.env.PORT || 5000

app.use('/api/v1/test', testRouter)

const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
});

process.on('unhandledRejection', (error, promise) => {
    console.log(`Error: ${error}`)
    server.close(() => process.exit(1))
});
