import Mailjet, { Client } from 'node-mailjet';
import { Service } from 'typedi';
import { IOtp } from '../models/OtpModel';
import { CannotSendEmailError } from '../errors/EmailError';

export interface IEmailService {
    sendOtp: (otp: IOtp) => Promise<boolean>;
}

@Service()
export class MailJetService implements IEmailService {
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

    async sendOtp(otp: IOtp): Promise<boolean> {
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
                                Email: otp.email,
                            },
                        ],
                        Subject: 'Welcome to Easy Task!',
                        TextPart: `Your OTP for verification is ${otp.otp}`,
                        HtmlPart: `
                            <p>Your OTP for email verification is</p>
                            <h3>${otp.otp}</h3>
                            <p>Reference: ${otp.reference}</p>
                        `,
                    },
                ],
            });
            return sent.response.status == 200;
        } catch (error) {
            throw new CannotSendEmailError((error as Error).message);
        }
    }
}
