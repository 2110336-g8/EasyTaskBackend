import { Inject, Service } from "typedi";
import { IStripeService, StripeService } from "../services/StripeService";
import { ValidationError } from "../errors/RepoError";
import { Request, Response } from 'express';



@Service()
class PaymentsController {
    private stripeService: IStripeService;

    constructor(@Inject(() => StripeService) stripeService: IStripeService) {
        this.stripeService = stripeService;
    }
    

    topUpWallet = async (req: Request, res: Response) => {
        res.status(200).json("success");   
             // try {
        //     var data = req.body;
        //     data.userId = req.user._id;
        //     const charge: ICharge | null = await this.stripeService.topUpWallet(data);

        //     if (!charge) {
        //         res.status(404).json({ error: 'User not found' });
        //         return;
        //     }
        //     res.status(200).json({ user });
        // } catch (error) {
        //     if (error instanceof ValidationError) {
        //         res.status(400).json({
        //             success: false,
        //             error: error.message,
        //         });
        //     } else {
        //         res.status(500).json({
        //             success: false,
        //             error: 'Internal Server Error',
        //         });
        //     }
        // }
    };


}

export default PaymentsController;
