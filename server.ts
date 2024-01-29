import express, { Request, Response } from "express";
import dotenv from "dotenv";
import userRouter from "./routes/UsersRoute";
import connectDB from "./config/db";
import authRouter from "./routes/AuthRoute";
import taskRouter from "./routes/TasksRoute";

// Load ENVs
dotenv.config({ path: `${__dirname}/config/config.env` });

// Parameters
const app = express();
const environment = process.env.ENVIRONMENT;
const isDevelopment = environment === "development";
const port: number = isDevelopment
    ? process.env.BACK_PORT_DEV === undefined
        ? 5001
        : parseInt(process.env.BACK_PORT_DEV, 10)
    : process.env.BACK_PORT === undefined
    ? 5000
    : parseInt(process.env.BACK_PORT, 10);
const hostname: string = isDevelopment
    ? process.env.BACK_HOSTNAME_DEV === undefined
        ? "localhost"
        : process.env.BACK_HOSTNAME_DEV
    : process.env.BACK_HOSTNAME === undefined
    ? "localhost"
    : process.env.BACK_HOSTNAME;

connectDB();

app.use(express.json());

app.use("/v1/users", userRouter);
app.use("/v1/auth", authRouter);
app.use("/v1/tasks", taskRouter);

// Other paths are invalid, res 404
app.use("*", (req: Request, res: Response) => {
    res.status(404).json({
        error: "Path Not Found",
    });
});

const server = app.listen(port, function () {
    console.log(`Server is running on http://localhost:${port}`);
});

process.on("unhandledRejection", function (error, promise) {
    console.log(`Error: ${error}`);
    server.close(() => process.exit(1));
});
