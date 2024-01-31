import { UsersRepository } from '../repositories/UsersRepo'
import { IUserDocument } from '../models/UserModel'
import { Service, Inject } from 'typedi'

@Service()
export class UsersService {
    private userRepository: UsersRepository

    constructor(@Inject() userRepository: UsersRepository) {
        this.userRepository = userRepository
    }

    async createUser(userData: IUserDocument): Promise<IUserDocument> {
        try {
            const createdUser = await this.userRepository.create(userData)
            return createdUser
        } catch (error) {
            throw error
        }
    }

    async getUserById(id: string): Promise<IUserDocument | null> {
        try {
            const user = await this.userRepository.findOne({ _id: id })
            if (!user) {
                return null
            }
            return user
        } catch (error) {
            throw error
        }
    }

    async getUserByEmail(email: string): Promise<IUserDocument | null> {
        try {
            const user = await this.userRepository.findOne({ email })
            if (!user) {
                return null
            }
            return user
        } catch (error) {
            throw error
        }
    }

    async updateUser(
        id: string,
        data: IUserDocument,
    ): Promise<IUserDocument | null> {
        try {
            const user = await this.userRepository.update(id, data)
            if (!user) {
                null
            }
            return user
        } catch (error) {
            throw error
        }
    }

    async deleteUser(id: string, password: string) {
        throw new Error('Not Implemented')
    }
}

export default UsersService
