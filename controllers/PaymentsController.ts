import { Inject, Service } from 'typedi';
import { IStripeService, StripeService } from '../services/StripeService';
import { ValidationError } from '../errors/RepoError';
import { Request, Response } from 'express';

@Service()
class PaymentsController {
    private stripeService: IStripeService;

    constructor(@Inject(() => StripeService) stripeService: IStripeService) {
        this.stripeService = stripeService;
    }

    topUpWallet = async (req: Request, res: Response) => {
        try {
            const data = req.body;
            const userId = req.user._id;
            const clientSecret: string = await this.stripeService.createTopupSession(
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
}

export default PaymentsController;
