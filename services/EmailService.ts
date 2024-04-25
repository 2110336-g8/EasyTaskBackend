import Mailjet, { Client } from 'node-mailjet';
import { Service } from 'typedi';
import { IOtp } from '../models/OtpModel';
import { CannotSendEmailError } from '../errors/EmailError';
import { IMail } from '../models/MailModel';
import { IWalletDocument } from '../models/WalletModel';
import { IUser } from '../models/UserModel';
export interface IEmailService {
    sendOtp: (otp: IOtp) => Promise<boolean>;
    sendTopUpConfirmation: (
        user: IUser,
        amount: number,
        sessionId: string,
    ) => Promise<boolean>;
    sendGeneralMail: (mail: IMail) => Promise<boolean>;
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

    sendOtp = async (otp: IOtp): Promise<boolean> => {
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
    };

    sendTopUpConfirmation = async (
        user: IUser,
        amount: number,
        sessionId: string,
    ): Promise<boolean> => {
        const mail = {
            receiverEmail: user.email as string,
            subject: `Topup Wallet Success`,
            textPart: '',
            htmlPart: `
            <p> Dear ${user?.firstName} ${user?.lastName},</p>
            <p>Your top up is successful.</p>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <th style="background-color: #f2f2f2; border: 1px solid #ddd; padding: 8px; text-align: left;">Detail</th>
                    <th style="background-color: #f2f2f2; border: 1px solid #ddd; padding: 8px; text-align: left;">Value</th>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">Amount</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${amount}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">Reference</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${sessionId}</td>
                </tr>
            </table>
            <p>If you have any questions, please email <a href='mailto:orders@example.com'> easy.task.se2@gmail.com </a></p>
            <p>Thank you for using our website.</p>

            <p>Best regards, <br>
            Easy Task Team</p>
            
            <a href=https://dev.easytask.vt.in.th/ads> Go to website now </a>      
            `,
            createAt: new Date(),
            sendAt: new Date(),
        } as IMail;
        return this.sendGeneralMail(mail);
    };

    sendGeneralMail = async (mail: IMail): Promise<boolean> => {
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
                                Email: mail.receiverEmail,
                            },
                        ],
                        Subject: mail.subject,
                        TextPart: mail.textPart,
                        HtmlPart: mail.htmlPart,
                    },
                ],
            });
            return sent.response.status == 200;
        } catch (error) {
            throw new CannotSendEmailError((error as Error).message);
        }
    };
}
