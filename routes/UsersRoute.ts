import express from 'express'
import {
    getUserById,
    deleteUser,
    isPhoneNumberExist,
    updateUserProfile,
} from '../controllers/UsersController'

const router = express.Router()

router
    .route('/:obj_id')
    .get(getUserById)
    .delete(deleteUser)
    .patch(updateUserProfile)
router.route('/isPhoneNumberExist/:phoneNo').get(isPhoneNumberExist)

export default router
