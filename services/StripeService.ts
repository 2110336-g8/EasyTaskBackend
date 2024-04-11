import { Inject, Service } from 'typedi';
import { IUsersRepository, UsersRepository } from '../repositories/UsersRepo';
import dotenv from 'dotenv';
dotenv.config({ path: './config/config.env' });

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export interface IStripeService {
    createTopupSession: (userId: string, amount: number) => Promise<string>;
}

@Service()
export class StripeService implements IStripeService {
    private usersRepository: IUsersRepository;

    constructor(
        @Inject(() => UsersRepository)
        usersRepository: IUsersRepository,
    ) {
        this.usersRepository = usersRepository;
    }

    createTopupSession = async (userId: string, amount: number): Promise<string> => {
        try {
            const session = await stripe.checkout.sessions.create({
                client_reference_id: userId,
                line_items: [
                    {
                        price_data: {
                            currency: 'THB',
                            product_data: {
                                name: 'Top Up Wallet',
                            },
                            unit_amount: amount,
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                ui_mode: 'embedded',
                return_url: `https://${process.env.FRONT_HOSTNAME}/topup/return?session_id={CHECKOUT_SESSION_ID}`,
            });
            console.log(session);
            return session.client_secret;
        } catch (error) {
            throw error;
        }
    };
}
