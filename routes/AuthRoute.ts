import express from "express";
import {newToken, checkValidateToken, loginUser, logoutUser} from "../controllers/AuthController";
import {validateLoginRequest, validateToken} from "../middlewares/AuthMiddleware";


const authRouter = express.Router();

// For token generation
authRouter.route('/token/new').post(validateLoginRequest, newToken);
authRouter.route('/token/validate').get(validateToken, checkValidateToken);

// Login and Logout
authRouter.route('/login').post(validateLoginRequest, loginUser);
authRouter.route('/logout').post(logoutUser);

export default authRouter;
