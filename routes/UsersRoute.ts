import express from 'express'
import {
    createUser,
    getUserInformation,
    deleteUser,
    isPhoneNumberExist,
    updateUserProfile,
} from '../controllers/UsersController'

const router = express.Router()

router.route('/').post(createUser)
router
    .route('/:obj_id')
    .get(getUserInformation)
    .delete(deleteUser)
    .patch(updateUserProfile)
router.route('/isPhoneNumberExist/:phoneNo').get(isPhoneNumberExist)

export default router
