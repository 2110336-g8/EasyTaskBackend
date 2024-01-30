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
        // TO-DO
        return ''
    }

    decodeToken(token: string) {
        return jwt.verify(token, this.key_pair.pub, {
            algorithms: ['RS256'],
        })
    }

    async verifyUser(login: ILoginInterface): Promise<boolean> {
        // TO-DO
        return false
    }
}
