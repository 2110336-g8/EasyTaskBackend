import express from "express";
import {getToken, checkToken, testAuthServer} from "../controllers/AuthController";


const authRouter = express.Router();

authRouter.route('/').get(testAuthServer);
authRouter.route('/token').get(getToken);
authRouter.route('/protected').get(checkToken);

export default authRouter;
