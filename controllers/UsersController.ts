import { Request, Response } from 'express'
import { UsersService as UsersService } from '../services/UsersService'
import { NotFoundError, ValidationError } from '../errors/RepoError'
import { Service, Inject } from 'typedi'

@Service()
class UserController {
    private userService: UsersService

    constructor(@Inject() userService: UsersService) {
        this.userService = userService
    }

    createUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const newUser = req.body
            const createdUser = await this.userService.createUser(newUser)
            res.status(201).json(createdUser)
        } catch (error) {
            if (error instanceof ValidationError) {
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
            const user = await this.userService.getUserById(id)
            res.status(200).json(user)
        } catch (error) {
            console.error(error)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    }

    updateUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = req.params.id
            const data = req.body
            const user = await this.userService.updateUser(id, data)
            res.status(200).json(user)
        } catch (error) {
            if (error instanceof ValidationError) {
                res.status(400).json({
                    error: error.name,
                    details: error.message,
                })
            } else if (error instanceof NotFoundError) {
                res.status(404).json({
                    error: error.message,
                    details: error.message,
                })
            } else {
                res.status(500).json({ error: 'Internal server error' })
            }
        }
    }
}
