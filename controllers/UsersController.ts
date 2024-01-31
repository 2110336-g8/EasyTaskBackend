import { Request, Response } from 'express'
import { UsersService as UsersService } from '../services/UsersService'
import { ValidationError } from '../errors/RepoError'
import { Service, Inject } from 'typedi'
import { CannotCreateUserError } from '../errors/UsersError'

@Service()
class UsersController {
    private usersService: UsersService

    constructor(@Inject() userService: UsersService) {
        this.usersService = userService
    }

    createUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const data = req.body
            const user = await this.usersService.createUser(data)
            res.status(201).json(user)
        } catch (error) {
            if (error instanceof CannotCreateUserError) {
                res.status(400).json({
                    error: error.name,
                    detalis: error.message,
                })
            } else {
                res.status(500).json({ error: 'Internal Server Error' })
            }
        }
    }

    getUserbyId = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = req.params.id
            const user = await this.usersService.getUserById(id)
            res.status(200).json(user)
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' })
        }
    }

    updateUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = req.params.id
            const data = req.body
            const user = await this.usersService.updateUser(id, data)
            if (!user) {
                res.status(404).json({
                    error: 'User not found',
                })
            }
            res.status(200).json(user)
        } catch (error) {
            if (error instanceof ValidationError) {
                res.status(400).json({
                    error: error.name,
                    details: error.message,
                })
            } else {
                res.status(500).json({ error: 'Internal server error' })
            }
        }
    }
}

export default UsersController
