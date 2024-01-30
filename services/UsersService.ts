import { UsersRepository } from '../repositories/UsersRepo'
import { IUser, IUserDocument } from '../models/UserModel'
import { Service, Inject } from 'typedi'
import { NotFoundError } from '../errors/RepoError'

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

    async getUserById(id: string): Promise<IUserDocument> {
        try {
            const user = await this.userRepository.findOne(id)
            if (!user) {
                throw new NotFoundError()
            }
            return user
        } catch (error) {
            throw error
        }
    }

    async updateUser(id: string, data: IUserDocument) {
        try {
            const user = await this.userRepository.update(id, data)
            if (!user) {
                throw new NotFoundError()
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
