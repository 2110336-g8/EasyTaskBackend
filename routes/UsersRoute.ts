import express from 'express'
import {
    getUserById,
    deleteUser,
    isPhoneNumberExist,
    updateUser,
} from '../controllers/UsersController'

const router = express.Router()

router.route('/:obj_id').get(getUserById).delete(deleteUser).patch(updateUser)
router.route('/isPhoneNumberExist/:phoneNo').get(isPhoneNumberExist)

export default router
