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

    validateCreateBankData = async (
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

    // Does not matter?
    // validateUpdateBankData = async (
    //     req: Request,
    //     res: Response,
    //     next: NextFunction,
    // ) => {
    //     const id: string = req.params.id;
    //     if (!id) {
    //         res.status(400).json({
    //             error: 'ID is required to update user',
    //         });
    //         return;
    //     }
    //     const data: IUser = req.body;
    //     const existing = await this.usersService.getUserById(id);

    //     if (!existing) {
    //         res.status(404).json({
    //             error: 'User not found',
    //         });
    //         return;
    //     }

    //     if (
    //         !existing.bankAccName &&
    //         !existing.bankId &&
    //         !existing.bankAccNo &&
    //         !data.bankAccName &&
    //         !data.bankId &&
    //         !data.bankAccNo
    //     ) {
    //         next();
    //         return;
    //     }

    //     if (
    //         !(
    //             (existing.bankAccName || data.bankAccName) &&
    //             (existing.bankId || data.bankId) &&
    //             (existing.bankAccNo || data.bankAccNo)
    //         )
    //     ) {
    //         res.status(400).json({
    //             error: 'Invalid updating bank data',
    //             details:
    //                 'bankId, bankAccName, and bankAccNo are required together or nothing',
    //         });
    //         return;
    //     }
    //     next();
    // };
}
