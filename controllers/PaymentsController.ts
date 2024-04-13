import { Inject, Service } from 'typedi';
import { IStripeService, StripeService } from '../services/StripeService';
import { ValidationError } from '../errors/RepoError';
import { Request, Response } from 'express';
import { TopupSessionStatus } from '../models/TopUpModel';
import { IWalletsService, WalletsService } from '../services/WalletsService';
import { IWalletDocument } from '../models/WalletModel';
import { IUsersService, UsersService } from '../services/UsersService';

@Service()
class PaymentsController {
    private stripeService: IStripeService;
    private walletsService: IWalletsService;
    private usersService: IUsersService;

    constructor(
        @Inject(() => StripeService) stripeService: IStripeService,
        @Inject(() => WalletsService) walletsService: IWalletsService,
        @Inject(() => UsersService) usersService: IUsersService,
    ) {
        this.stripeService = stripeService;
        this.walletsService = walletsService;
        this.usersService = usersService;
    }

    topUpWallet = async (req: Request, res: Response) => {
        try {
            const data = req.body;
            const userId = req.user._id;
            const clientSecret: string =
                await this.stripeService.createTopupSession(
                    userId,
                    data.amount,
                );

            res.status(200).json({ success: true, clientSecret });
        } catch (error) {
            if (error instanceof ValidationError) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Internal Server Error',
                });
            }
        }
    };

    checkTopupSessionStatus = async (req: Request, res: Response) => {
        try {
            const sessionId = req.body.sessionId;
            const topupSessionStatus: TopupSessionStatus =
                await this.stripeService.checkTopupSessionStatus(sessionId);

            res.status(200).json({ success: true, ...topupSessionStatus });
        } catch (error) {
            if (error instanceof ValidationError) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Internal Server Error',
                });
            }
        }
    };

    getWalletAmount = async (req: Request, res: Response) => {
        try {
            const userId = req.user._id;
            const user = await this.usersService.getUserById(userId);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            const wallet: IWalletDocument | null =
                await this.walletsService.getWalletByUserId(userId);

            if (!wallet) {
                res.status(404).json({ error: 'Wallet not found' });
                return;
            }
            res.status(200).json({
                success: true,
                walletAmount: wallet.walletAmount,
            });
        } catch (error) {
            if (error instanceof ValidationError) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Internal Server Error',
                });
            }
        }
    };
}

export default PaymentsController;
