import jwt from 'jsonwebtoken'
import fs from 'fs'
import { LoginInterface } from '../models/AuthModel'
import { UserModel } from '../models/UserModel'

const key_pair = {
    key: fs.readFileSync(`${__dirname}/../config/rs256.key`),
    pub: fs.readFileSync(`${__dirname}/../config/rs256.key.pub`),
}

class AuthService {
    static generateToken(
        payload: LoginInterface,
        sessionMinutes: number = 60,
    ): string {
        const expiryTime: number =
            Math.floor(Date.now() / 1000) + sessionMinutes * 60
        const subPayload = {
            phoneNumber: payload.phoneNumber,
        }
        return jwt.sign(subPayload, key_pair.key, {
            expiresIn: expiryTime,
            algorithm: 'RS256',
        })
    }

    static decodeToken(token: string) {
        return jwt.verify(token, key_pair.pub, {
            algorithms: ['RS256'],
        })
    }

    /**
     * Verify user-password pair with the database
     * Returns false if no user OR password.
     *
     * @param login
     */
    static async verifyUser(login: LoginInterface): Promise<boolean> {
        const user = await UserModel.findOne({ phoneNumber: login.phoneNumber })

        // No user in the database.
        if (!user) {
            return false
        }

        return await user.isValidPassword(login.password)
    }
}

export default AuthService
