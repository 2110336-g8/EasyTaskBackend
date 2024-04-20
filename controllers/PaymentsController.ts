import { Inject, Service } from 'typedi';
import { IStripeService, StripeService } from '../services/StripeService';
import { ValidationError } from '../errors/RepoError';
import { Request, Response } from 'express';
import { TopupSessionStatus } from '../models/TopUpModel';
import { IWalletsService, WalletsService } from '../services/WalletsService';
import { IWalletDocument } from '../models/WalletModel';
import { IUsersService, UsersService } from '../services/UsersService';
import dotenv from 'dotenv';
dotenv.config({ path: './config/config.env' });

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const stripeEndpontSecret = process.env.STRIPE_ENDPOINT_SECRET_KEY;

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

    stripeWebhook = async (req: Request, res: Response) => {
        const sig = req.headers['stripe-signature'];
        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                stripeEndpontSecret,
            );
        } catch (err) {
            res.status(400).send(`Webhook Error: ${(err as any).message}`);
            return;
        }

        switch (event.type) {
            case 'checkout.session.completed':
                try {
                    const checkoutSessionCompleted = event.data.object;
                    const userId = checkoutSessionCompleted.client_reference_id;
                    const amount = checkoutSessionCompleted.amount_total / 100;
                    const sessionId = checkoutSessionCompleted.id;
                    const updatedWallet =
                        await this.walletsService.addTopupHistory(
                            String(userId),
                            Number(amount),
                            String(sessionId),
                        );
                    if (!updatedWallet)
                        res.status(500).send(`Updated Wallet Error`);
                } catch (err) {
                    res.status(500).send(`Updated Wallet Error: ${err}`);
                }

                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.send();
    };

    topUpWallet = async (req: Request, res: Response) => {
        try {
            const data = req.body;
            const userId = req.user._id;
            const userEmail = req.user.email;
            const clientSecret: string =
                await this.stripeService.createTopupSession(
                    String(userId),
                    String(userEmail),
                    Number(data.amount),
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
                await this.stripeService.checkTopupSessionStatus(
                    String(sessionId),
                );

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
            const user = await this.usersService.getUserById(String(userId));
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            const wallet: IWalletDocument | null =
                await this.walletsService.getWalletByUserId(String(userId));

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

    getWalletHistory = async (req: Request, res: Response) => {
        try {
            const userId = req.user._id;
            const user = await this.usersService.getUserById(String(userId));
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            const walletHistory: {
                walletHistory: IWalletDocument['paymentHistory'];
                count: number;
            } = await this.walletsService.getWalletHistory(
                String(userId),
                req.query.page ? Number(req.query.page) : 1,
                req.query.limit ? Number(req.query.limit) : 10,
            );

            res.status(200).json({
                success: true,
                ...walletHistory,
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
