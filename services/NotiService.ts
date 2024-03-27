import { Service, Inject } from 'typedi';
import { IMail } from '../models/MailModel';
import { IEmailService, MailJetService } from './EmailService';
import { ITask, ITaskDocument } from '../models/TaskModel';
import { ITasksRepository, TasksRepository } from '../repositories/TasksRepo';
import { IUsersRepository, UsersRepository } from '../repositories/UsersRepo';

export interface INotiService {
    notiEndDateTask: (task: ITaskDocument) => Promise<boolean>;
    notiFullAcceptedApplicant: (customerId: string) => Promise<boolean>;
    notiSixDayAfterEndApply: (task: ITaskDocument) => Promise<boolean>;
}

@Service()
export class NotiService implements INotiService {
    private mailService: IEmailService;
    private tasksRepository: ITasksRepository;
    private usersRepository: IUsersRepository;

    constructor(
        @Inject(() => MailJetService) mailService: IEmailService,
        @Inject(() => TasksRepository) tasksRepository: ITasksRepository,
        @Inject(() => UsersRepository) usersRepository: IUsersRepository,
    ) {
        this.mailService = mailService;
        this.tasksRepository = tasksRepository;
        this.usersRepository = usersRepository;
    }
    notiEndDateTask = async (task: ITaskDocument): Promise<boolean> => {
        const customerId = task.customerId;
        const applicants = task.applicants;
        let customerEmail: string | undefined | null;

        try {
            if (customerId) {
                customerEmail = await this.usersRepository.findUserEmail(
                    customerId.toString(),
                );
            }
            if (!customerEmail) {
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
                await this.notiCustomerToStart(customerEmail);
            } else {
                // Dismiss the task if no applicants have been accepted
                await this.tasksRepository.updateStatus(task.id, 'Dismissed');
                await this.notiCustomerDismissedTask(customerEmail);
                return true; // Task dismissed
            }

            // Notify pending applicants
            for (const app of pendingApplicants) {
                if (app.userId) {
                    const applicantEmail =
                        await this.usersRepository.findUserEmail(
                            app.userId.toString(),
                        );
                    if (!applicantEmail) {
                        throw new Error('Pending applicant email not found');
                    }
                    await this.notifyPendingApplicant(applicantEmail);
                }
            }

            // Notify offering applicants
            for (const app of offeringApplicants) {
                if (app.userId) {
                    const applicantEmail =
                        await this.usersRepository.findUserEmail(
                            app.userId.toString(),
                        );
                    if (!applicantEmail) {
                        throw new Error('Offering applicant email not found');
                    }
                    await this.notifyOfferingApplicant(applicantEmail);
                }
            }
            // Notify accepted applicants
            for (const app of acceptedApplicants) {
                if (app.userId) {
                    const applicantEmail =
                        await this.usersRepository.findUserEmail(
                            app.userId.toString(),
                        );
                    if (!applicantEmail) {
                        throw new Error('Accepted applicant email not found');
                    }
                    await this.notifyAcceptedApplicant(applicantEmail);
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
            let customerEmail: string | undefined | null;
            if (customerId) {
                customerEmail = await this.usersRepository.findUserEmail(
                    customerId.toString(),
                );
            }
            if (!customerEmail) {
                throw new Error('Customer email not found');
            }
            await this.notiCustomerToStartLastChance(customerEmail.toString());
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
        customerId: string,
    ): Promise<boolean> => {
        try {
            const customerEmail =
                await this.usersRepository.findUserEmail(customerId);
            if (!customerEmail) {
                throw new Error('Customer email not found');
            }
            await this.notiCustomerFullAcceptedApplicant(customerEmail);
            return true;
        } catch (error) {
            return false;
        }
    };

    //private ---------------------------------------------------------------------------------------------

    // Noti customer --------------------------
    private async notiCustomerToStart(customerEmail: string): Promise<void> {
        //noti to start within 1 week
        const mail = {
            receiverEmail: customerEmail,
            subject: '',
            textPart: '',
            htmlPart: '',
            createAt: new Date(),
            sendAt: new Date(),
        } as IMail;
        this.mailService.sendGeneralMail(mail);
    }

    private async notiCustomerDismissedTask(
        customerEmail: string,
    ): Promise<void> {
        const mail = {
            receiverEmail: customerEmail,
            subject: '',
            textPart: '',
            htmlPart: '',
            createAt: new Date(),
            sendAt: new Date(),
        } as IMail;
        this.mailService.sendGeneralMail(mail);
    }

    private async notiCustomerToStartLastChance(
        customerEmail: string,
    ): Promise<void> {
        //noti to start within 1 week
        const mail = {
            receiverEmail: customerEmail,
            subject: '',
            textPart: '',
            htmlPart: '',
            createAt: new Date(),
            sendAt: new Date(),
        } as IMail;
        this.mailService.sendGeneralMail(mail);
    }

    private async notiCustomerFullAcceptedApplicant(
        customerEmail: string,
    ): Promise<void> {
        //like noti to start
        const mail = {
            receiverEmail: customerEmail,
            subject: '',
            textPart: '',
            htmlPart: '',
            createAt: new Date(),
            sendAt: new Date(),
        } as IMail;
        this.mailService.sendGeneralMail(mail);
    }

    // Noti applicant---------------------

    private async notifyPendingApplicant(
        applicantEmail: string,
    ): Promise<void> {
        const mail = {
            receiverEmail: applicantEmail,
            subject: '',
            textPart: '',
            htmlPart: '',
            createAt: new Date(),
            sendAt: new Date(),
        } as IMail;
        this.mailService.sendGeneralMail(mail);
    }

    private async notifyOfferingApplicant(
        applicantEmail: string,
    ): Promise<void> {
        const mail = {
            receiverEmail: applicantEmail,
            subject: '',
            textPart: '',
            htmlPart: '',
            createAt: new Date(),
            sendAt: new Date(),
        } as IMail;
        this.mailService.sendGeneralMail(mail);
    }

    private async notifyAcceptedApplicant(
        applicantEmail: string,
    ): Promise<void> {
        const mail = {
            receiverEmail: applicantEmail,
            subject: '',
            textPart: '',
            htmlPart: '',
            createAt: new Date(),
            sendAt: new Date(),
        } as IMail;
        this.mailService.sendGeneralMail(mail);
    }
}
