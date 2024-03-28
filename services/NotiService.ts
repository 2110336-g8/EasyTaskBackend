import { Service, Inject } from 'typedi';
import { IMail } from '../models/MailModel';
import { IEmailService, MailJetService } from './EmailService';
import { ITask, ITaskDocument } from '../models/TaskModel';
import { ITasksRepository, TasksRepository } from '../repositories/TasksRepo';
import { IUsersRepository, UsersRepository } from '../repositories/UsersRepo';
import { IUserDocument } from '../models/UserModel';
import { MailRepository, IMailRepository } from '../repositories/MailsRepo';


// const fs = require('fs');
// const logoSvg = fs.readFileSync('logo.svg', { encoding: 'utf-8' });
// const logoBase64 = Buffer.from(logoSvg).toString('base64');
// const logoUrl = `data:image/svg+xml;base64,${logoBase64}`;
export interface INotiService {
    notiEndDateTask: (task: ITaskDocument) => Promise<boolean>;
    notiFullAcceptedApplicant: (task: ITaskDocument) => Promise<boolean>;
    notiSixDayAfterEndApply: (task: ITaskDocument) => Promise<boolean>;
}

@Service()
export class NotiService implements INotiService {
    private mailService: IEmailService;
    private mailReposiotry: IMailRepository;
    private tasksRepository: ITasksRepository;
    private usersRepository: IUsersRepository;

    constructor(
        @Inject(() => MailJetService) mailService: IEmailService,
        @Inject(() => MailRepository) MailRepository: IMailRepository,
        @Inject(() => TasksRepository) tasksRepository: ITasksRepository,
        @Inject(() => UsersRepository) usersRepository: IUsersRepository,
    ) {
        this.mailService = mailService;
        this.mailReposiotry = MailRepository;
        this.tasksRepository = tasksRepository;
        this.usersRepository = usersRepository;
    }
    notiEndDateTask = async (task: ITaskDocument): Promise<boolean> => {
        const customerId = task.customerId;
        const applicants = task.applicants;
        let customer: IUserDocument | undefined | null;

        try {
            if (customerId) {
                customer = await this.usersRepository.findById(
                    customerId.toString(),
                );
            }
            if (!customer) {
                throw new Error('Customer email not found');
            }

            const pendingApplicants = applicants.filter(
                applicant => applicant.status === 'Pending',
            );
            const offeringApplicants = applicants.filter(
                applicant => applicant.status === 'Offering',
            );
            const acceptedApplicants = applicants.filter(
                applicant => applicant.status === 'Accepted',
            );

            // Notify customer to start/dismiss the task or the task will be dismissed
            if (acceptedApplicants.length >= 1) {
                //start/dismiss the task
                await this.notiCustomerToStart(customer, task.title);
            } else {
                // Dismiss the task if no applicants have been accepted
                await this.tasksRepository.updateStatus(task.id, 'Dismissed');
                await this.notiCustomerDismissedTask(customer, task.title);
                return true; // Task dismissed
            }

            // Notify pending applicants
            for (const app of pendingApplicants) {
                if (app.userId) {
                    const applicant = await this.usersRepository.findById(
                        app.userId.toString(),
                    );
                    if (!applicant) {
                        throw new Error('Pending applicant not found');
                    }
                    await this.notifyRejectedApplicant(applicant, task.title);
                    await this.tasksRepository.updateApplicantStatus(
                        task.id,
                        [app.userId.toString()],
                        ['Pending'],
                        'NotProceed',
                    );
                }
            }

            // Notify offering applicants
            for (const app of offeringApplicants) {
                if (app.userId) {
                    const applicant = await this.usersRepository.findById(
                        app.userId.toString(),
                    );
                    if (!applicant) {
                        throw new Error('Offering applicant not found');
                    }
                    await this.notifyDismissedApplicant(applicant, task.title);
                    await this.tasksRepository.updateApplicantStatus(
                        task.id,
                        [app.userId.toString()],
                        ['Offering'],
                        'NotProceed',
                    );
                }
            }

            // Notify accepted applicants
            for (const app of acceptedApplicants) {
                if (app.userId) {
                    const applicant = await this.usersRepository.findById(
                        app.userId.toString(),
                    );
                    if (!applicant) {
                        throw new Error('Accepted applicant not found');
                    }
                    await this.notifyAcceptedApplicant(applicant, task.title);
                }
            }
            return true;
        } catch (error) {
            console.error(
                'An error occurred during notification process:',
                error,
            );
            return false;
        }
    };

    notiSixDayAfterEndApply = async (task: ITaskDocument): Promise<boolean> => {
        try {
            const customerId = task.customerId;
            let customer: IUserDocument | undefined | null;
            if (customerId) {
                customer = await this.usersRepository.findById(
                    customerId.toString(),
                );
            }
            if (!customer) {
                throw new Error('Customer email not found');
            }
            await this.notiCustomerToStartLastChance(customer, task.title);
            return true;
        } catch (error) {
            console.error(
                'An error occurred during notification process:',
                error,
            );
            return false;
        }
    };

    notiFullAcceptedApplicant = async (
        task: ITaskDocument,
    ): Promise<boolean> => {
        try {
            const customerId = task.customerId;
            let customer: IUserDocument | undefined | null;
            if (customerId) {
                customer = await this.usersRepository.findById(
                    customerId.toString(),
                );
            }
            if (!customer) {
                throw new Error('Customer email not found');
            }
            await this.notiCustomerFullAcceptedApplicant(customer, task.title);
            return true;
        } catch (error) {
            return false;
        }
    };

    //private ---------------------------------------------------------------------------------------------

    // Noti customer --------------------------
    private async notiCustomerToStart(
        customer: IUserDocument,
        taskTitle: string,
    ): Promise<void> {
        //noti to start within 1 week
        const mail = {
            receiverEmail: customer.email as string,
            subject: `Important Notice: Completion of Application Period on Easy Task`,
            textPart: `
            Dear ${customer?.firstName} ${customer?.lastName},
            The application period for the ${taskTitle} has ended. Kindly ensure all wages are paid within one week to avoid automatic job dismissal. 
            Once paid, proceed to assign the job via our website's messaging service.
            
            Thank you.

            Best regards,
            Easy Task Team
            `,
            htmlPart: `
 
            <p> Dear ${customer?.firstName} ${customer?.lastName},</p>
            <p> The application period for the <b>${taskTitle}</b> has ended. 
            <b> Kindly ensure all wages are paid within one week to avoid automatic job dismissal. </b> Once paid, proceed to assign the job via our website's messaging service. </p>
            
            <p>Thank you.</p>

            <p>Best regards, <br>
            Easy Task Team</p>
            
            <a href=https://dev.easytask.vt.in.th/ads> Go to website now </a>
            `,
            createAt: new Date(),
            sendAt: new Date(),
        } as IMail;
        this.mailService.sendGeneralMail(mail);
    }

    private async notiCustomerDismissedTask(
        customer: IUserDocument,
        taskTitle: string,
    ): Promise<void> {
        const mail = {
            receiverEmail: customer.email as string,
            subject: `Application Period Ended: ${taskTitle} Advertisement on Easy Task`,
            textPart: `
            Dear ${customer?.firstName} ${customer?.lastName},
            I regret to inform you that the application period for the ${taskTitle} advertisement has closed without receiving any applicants. Consequently, the advertisement will be dismissed.
            
            Thank you for using our website.

            Best regards,
            Easy Task Team
            `,
            htmlPart: `
 
            <p> Dear ${customer?.firstName} ${customer?.lastName},</p>
            <p> I regret to inform you that the application period for the <b>${taskTitle}</b> advertisement has closed without receiving any applicants. Consequently, the advertisement will be dismissed. </p>
            
            <p>Thank you for using our website.</p>

            <p>Best regards, <br>
            Easy Task Team</p>
            
            <a href=https://dev.easytask.vt.in.th/ads> Go to website now </a>
            `,
            createAt: new Date(),
            sendAt: new Date(),
        } as IMail;
        this.mailService.sendGeneralMail(mail);
    }

    private async notiCustomerToStartLastChance(
        customer: IUserDocument,
        taskTitle: string,
    ): Promise<void> {
        //noti to start within 1 week
        const mail = {
            receiverEmail: customer.email as string,
            subject: `Urgent: Payment Required for ${taskTitle} on Easy Task`,
            textPart: `
            Dear ${customer?.firstName} ${customer?.lastName},
            Gentle reminder that the application period for the ${taskTitle} has now concluded. As of now, wages for the task have not been paid. Kindly ensure payment is made by tomorrow to prevent the task from being dismissed.

            Thank you for your prompt attention to this matter.
            
            Best regards,
            Easy Task Team
            `,
            htmlPart: `
 
            <p> Dear ${customer?.firstName} ${customer?.lastName},</p>
            <p> Gentle reminder that the application period for the <b>${taskTitle}</b> as now concluded. As of now, wages for the task have not been paid. Kindly ensure payment is made by tomorrow to prevent the task from being dismissed.
            </p>
            
            <p>Thank you for your prompt attention to this matter.</p>

            <p>Best regards, <br>
            Easy Task Team</p>
            
            <a href=https://dev.easytask.vt.in.th/ads> Go to website now </a>
            `,
            createAt: new Date(),
            sendAt: new Date(),
        } as IMail;
        this.mailService.sendGeneralMail(mail);
    }

    private async notiCustomerFullAcceptedApplicant(
        customer: IUserDocument,
        taskTitle: string,
    ): Promise<void> {
        //like noti to start
        console.log(logo);
        const mail = {
            receiverEmail: customer.email as string,
            subject: `Confirmation: Team Size Reached for ${taskTitle} on Easy Task`,
            textPart: `
            Dear ${customer?.firstName} ${customer?.lastName},
            We're pleased to inform you that the preferred employees for the ${taskTitle} have been selected, and the desired team size has been reached. You can now proceed with the job as planned. Kindly ensure all wages are paid promptly to avoid any delays.
            
            Thank you for using our website.
           
            Best regards,
            Easy Task Team
            `,
            htmlPart: `
 
            <p> Dear ${customer?.firstName} ${customer?.lastName},</p>
            <p> We're pleased to inform you that the preferred employees for the <b>${taskTitle}</b> have been selected, and the desired team size has been reached. You can now proceed with the job as planned. Kindly ensure all wages are paid promptly to avoid any delays.
            </p>
            
            <p>Thank you for using our website.</p>

            <p>Best regards, <br>
            Easy Task Team</p>
            
            <a href=https://dev.easytask.vt.in.th/ads> Go to website now </a> 
            `,
            createAt: new Date(),
            sendAt: new Date(),
        } as IMail;
        this.mailService.sendGeneralMail(mail);
    }

    // Noti applicant---------------------

    private async notifyRejectedApplicant(
        applicant: IUserDocument,
        taskTitle: string,
    ): Promise<void> {
        const mail = {
            receiverEmail: applicant.email as string,
            subject: `Update on Your Application for ${taskTitle} on Easy Task`,
            textPart: `
            Dear ${applicant?.firstName} ${applicant?.lastName},

            After the client has been carefully considerate all applicants, we regret to inform you that we will not be proceeding with your application for the ${taskTitle}. We appreciate your interest and wish you success in your job search.
        
            Best regards,
            Easy Task Team
            `,
            htmlPart: `
 
            <p> Dear ${applicant?.firstName} ${applicant?.lastName},</p>
            <p> After the client has been carefully considerate all applicants, we regret to inform you that we will not be proceeding with your application for the <b>${taskTitle}</b> We appreciate your interest and wish you success in your job search.
            </p>

            <p>Best regards, <br>
            Easy Task Team</p>
            
            <a href=https://dev.easytask.vt.in.th/ads> Go to website now </a> 
            `,
            createAt: new Date(),
            sendAt: new Date(),
        } as IMail;
        this.mailService.sendGeneralMail(mail);
    }

    private async notifyDismissedApplicant(
        applicant: IUserDocument,
        taskTitle: string,
    ): Promise<void> {
        const mail = {
            receiverEmail: applicant.email as string,
            subject: `Cancellation of ${taskTitle} on Easy Task`,
            textPart: `
            Dear ${applicant?.firstName} ${applicant?.lastName},

            Congratulations on being selected for the ${taskTitle}!
            
            In the next few days, you can expect to receive more details about your role in the messages section of our website.Please note that there may be a slight delay of up to one week after the application period ends before we finalize all arrangements.

            Best regards,
            Easy Task Team
            `,
            htmlPart: `
 
            <p> Dear ${applicant?.firstName} ${applicant?.lastName},</p>
            <p> Congratulations on being selected for the <b>${taskTitle}</b> 
            
            <p> In the next few days, you can expect to receive more details about your role in the messages section of our website.Please note that there may be a slight delay of up to one week after the application period ends before we finalize all arrangements.
            </p>

            <p>Best regards, <br>
            Easy Task Team</p>
            
            <a href=https://dev.easytask.vt.in.th/ads> Go to website now </a> `,
            createAt: new Date(),
            sendAt: new Date(),
        } as IMail;
        this.mailService.sendGeneralMail(mail);
    }

    private async notifyAcceptedApplicant(
        applicant: IUserDocument,
        taskTitle: string,
    ): Promise<void> {
        const mail = {
            receiverEmail: applicant.email as string,
            subject: `Acceptance of Your Job Application for ${taskTitle} on Easy Task`,
            textPart: `
            Dear ${applicant?.firstName} ${applicant?.lastName},

            Congratulations on being selected for the ${taskTitle}!
            
            In the next few days, you can expect to receive more details about your role in the messages section of our website.Please note that there may be a slight delay of up to one week after the application period ends before we finalize all arrangements.

            Best regards,
            Easy Task Team
            `,
            htmlPart: `
 
            <p> Dear ${applicant?.firstName} ${applicant?.lastName},</p>
            <p> Congratulations on being selected for the <b>${taskTitle}</b> 
            
            <p> In the next few days, you can expect to receive more details about your role in the messages section of our website.Please note that there may be a slight delay of up to one week after the application period ends before we finalize all arrangements.
            </p>

            <p>Best regards, <br>
            Easy Task Team</p>
            
            <a href=https://dev.easytask.vt.in.th/ads> Go to website now </a> `,
            createAt: new Date(),
            sendAt: new Date(),
        } as IMail;
        this.mailService.sendGeneralMail(mail);
    }
}
