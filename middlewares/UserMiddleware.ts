import { NextFunction, Request, Response } from 'express';
import { Inject, Service } from 'typedi';
import { IUser, IUserDocument } from '../models/UserModel';
import { IUsersService, UsersService } from '../services/UsersService';

@Service()
export class UserMiddleware {
    private usersService: IUsersService;

    constructor(@Inject(() => UsersService) usersService: IUsersService) {
        this.usersService = usersService;
    }

    validateCreateUserData = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        const data: IUser = req.body;
        if (!data.bankAccName && !data.bankId && !data.bankAccNo) {
            next();
            return;
        }
        if (!(data.bankAccName && data.bankId && data.bankAccNo)) {
            res.status(400).json({
                error: 'Validation Error',
                details:
                    'User validation failed: bankId, bankAccName, and bankAccNo are required together or nothing',
            });
            return;
        }
        next();
    };

    validateUpdateUserData = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        const id: string = req.params.id;

        if (!id) {
            res.status(400).json({
                error: 'Id is required to update user',
            });
            return;
        }

        const data: IUser = req.body;
        const existing = await this.usersService.getUserById(id);
        if (!existing) {
            res.status(404).json({
                error: 'User not found',
            });
            return;
        }

        if (data.email) {
            res.status(400).json({
                error: 'Validation Error',
                details: 'User validation failed: cannot update email',
            });
            return;
        }

        if (
            !existing.bankAccName &&
            !existing.bankId &&
            !existing.bankAccNo &&
            !data.bankAccName &&
            !data.bankId &&
            !data.bankAccNo
        ) {
            next();
            return;
        }

        if (
            !(
                (existing.bankAccName || data.bankAccName) &&
                (existing.bankId || data.bankId) &&
                (existing.bankAccNo || data.bankAccNo)
            )
        ) {
            res.status(400).json({
                error: 'Invalid updating bank data',
                details:
                    'bankId, bankAccName, and bankAccNo are required together or nothing',
            });
            return;
        }
        next();
    };

    // put all validation for updating user into this function, including updating bank?
    // validateUpdateUserData = async (
    //     req: Request,
    //     res: Response,
    //     next: NextFunction,
    // ) => {
    //     const data: IUser = req.body;
    //     if (data.email) {
    //         res.status(400).json({
    //             error: 'Validation Error',
    //             details: 'User validation failed: cannot update email',
    //         });
    //         return;
    //     }
    //     next();
    // };

    validateUpdatePassword = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        const id: string = req.params.id;
        if (!id) {
            res.status(400).json({
                error: 'ID is required to update user',
            });
            return;
        }

        const existing = await this.usersService.getUserById(id);
        if (!existing) {
            res.status(404).json({
                error: 'User not found',
            });
            return;
        }

        const data = req.body;
        if (!data.currentPassword &&
            !data.newPassword
        ) {
            next();
            return;
        }
        if (!data.currentPassword || !data.newPassword) {
            res.status(400).json({
                error: 'Invalid changing password',
                details:
                    'currentPassword and newPassword are required',
            });
            return;
        }
        next();
    };
}
