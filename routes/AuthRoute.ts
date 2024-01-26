import express from "express";
import {newToken, checkToken, testAuthServer} from "../controllers/AuthController";


const authRouter = express.Router();

authRouter.route('/').get(testAuthServer);
authRouter.route('/token').post(newToken);
authRouter.route('/protected').get(checkToken);

export default authRouter;
