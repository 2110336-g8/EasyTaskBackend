import jwt from 'jsonwebtoken'
import fs from 'fs'
import { Inject, Service } from 'typedi'
import { UsersRepository } from '../repositories/UsersRepo'
import { ILoginInterface } from '../models/AuthModel'

@Service()
class AuthService {
    private userRepository: UsersRepository
    private key_pair = {
        key: fs.readFileSync(`${__dirname}/../config/rs256.key`),
        pub: fs.readFileSync(`${__dirname}/../config/rs256.key.pub`),
    }

    constructor(@Inject() userRepository: UsersRepository) {
        this.userRepository = userRepository
    }

    generateToken(
        payload: ILoginInterface,
        sessionMinutes: number = parseInt(process.env.JWT_EXP_MIN || '60'),
    ): string {
        const expiryTime: number =
            Math.floor(Date.now() / 1000) + sessionMinutes * 60
        const subPayload = {
            phoneNumber: payload.phoneNumber,
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
        const user = await this.userRepository.findOne(login.phoneNumber)

        if (!user) {
            return false
        }

        return await user.isValidPassword(login.password)
    }
}

export default AuthService
