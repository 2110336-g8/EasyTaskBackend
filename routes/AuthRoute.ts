import express from 'express'
import AuthController from '../controllers/AuthController'
import Container from 'typedi'
import AuthMiddleware from '../middlewares/AuthMiddleware'

const router = express.Router()
const authController = Container.get(AuthController)
const authMiddleware = Container.get(AuthMiddleware)

// For token generation
// router.route('/token/new').post(validateLoginRequest, newToken)
// router.route('/token/validate').get(validateToken, checkValidateToken)

// OTP
router.route('/sendOtp').post(authController.sentOtp)
router.route('/verifyOtp').post(authController.verifyOtp)

// Register
router
    .route('/register')
    .post(authController.loginUser, authController.newToken)

// Login and Logout
router
    .route('/login')
    .post(
        authMiddleware.validateLoginRequest,
        authController.loginUser,
        authController.newToken,
    )
router.route('/logout').post(authController.logoutUser)

export default router
