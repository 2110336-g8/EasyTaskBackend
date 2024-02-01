import Mailjet, { Client } from 'node-mailjet';
import { Service } from 'typedi';

export interface IEmailService {
    sendOtp: (email: string, otp: string) => Promise<boolean>;
}

@Service()
export class MailJetService {
    private mailjet: Client;

    constructor() {
        if (!process.env.MJ_APIKEY_PUBLIC || !process.env.MJ_APIKEY_PRIVATE) {
            throw Error('Mail Jet API key is not defined in env');
        }
        this.mailjet = Mailjet.apiConnect(
            process.env.MJ_APIKEY_PUBLIC,
            process.env.MJ_APIKEY_PRIVATE,
        );
    }

    async sendOtp(email: string, otp: string): Promise<boolean> {
        try {
            const post = this.mailjet.post('send', { version: 'v3.1' });
            const sent = await post.request({
                Messages: [
                    {
                        From: {
                            Email: process.env.SENDER_EMAIL,
                            Name: 'Easy Task',
                        },
                        To: [
                            {
                                Email: email,
                            },
                        ],
                        Subject: 'Welcome to Easy Task!',
                        TextPart: `Your OTP for verification is ${otp}`,
                    },
                ],
            });
            return sent.response.status == 200;
        } catch (error) {
            return false;
        }
    }
}
