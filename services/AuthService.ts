import jwt from 'jsonwebtoken'
import fs from 'fs'
import { Inject, Service } from 'typedi'
import { ILoginInterface } from '../models/AuthModel'
import { UsersService } from './UsersService'

@Service()
export class AuthService {
    private usersService: UsersService
    private key_pair = {
        key: fs.readFileSync(`${__dirname}/../config/rs256.key`),
        pub: fs.readFileSync(`${__dirname}/../config/rs256.key.pub`),
    }

    constructor(@Inject() usersService: UsersService) {
        this.usersService = usersService
    }

    generateToken(
        payload: ILoginInterface,
        sessionMinutes: number = parseInt(process.env.JWT_EXP_MIN || '60'),
    ): string {
        const expiryTime: number =
            Math.floor(Date.now() / 1000) + sessionMinutes * 60
        const subPayload = {
            phoneNumber: payload.email,
        }
        return jwt.sign(subPayload, this.key_pair.key, {
            expiresIn: expiryTime,
            algorithm: 'RS256',
        })
    }

    decodeToken(token: string) {
        return jwt.verify(token, this.key_pair.pub, {
            algorithms: ['RS256'],
        })
    }

    async verifyUser(login: ILoginInterface): Promise<boolean> {
        // try {
        //     const user = await this.usersService.getUserByPhone(
        //         login.phoneNumber,
        //     )
        //     const isVerify = await user.isValidPassword(login.password)
        //     return isVerify
        // } catch (error) {
        //     console.error(error)
        //     return false
        // }
        return false
    }
}
