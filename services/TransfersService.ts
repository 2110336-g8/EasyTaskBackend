import { Inject, Service } from 'typedi';
import dotenv from 'dotenv';
import {
    ITransfersRepository,
    TransfersRepository,
} from '../repositories/TransferRepository';
import { ITaskDocument } from '../models/TaskModel';
import {
    IWalletsRepository,
    WalletsRepository,
} from '../repositories/WalletsRepository';
import { ITransferDocument } from '../models/TransferModel';
import { ValidationError } from '../errors/RepoError';
import {
    NotEnoughMoneyError,
    CustomerWalletNotFoundError,
} from '../errors/WalletError';
import {
    CannotTransferError,
    TaskTransferNotFoundError,
    NotEnoughMoneyInTaskTransfer,
    NotCorrectAmountTransferError,
} from '../errors/TransferError';

import mongoose from 'mongoose';
import { Types } from 'mongoose';
dotenv.config({ path: './config/config.env' });

export interface ITransfersService {
    startTaskTransfer: (task: ITaskDocument) => Promise<ITransferDocument>;
    dismissInprogressTaskTransfer: (
        task: ITaskDocument,
    ) => Promise<ITransferDocument>;
    acceptTaskPayment: (
        taskId: string,
        workerId: string,
        wage: number,
    ) => Promise<ITransferDocument>;
}

@Service()
export class TransfersService implements ITransfersService {
    private transfersRepository: ITransfersRepository;
    private walletsRepository: IWalletsRepository;
    constructor(
        @Inject(() => TransfersRepository)
        transfersRepository: ITransfersRepository,
        @Inject(() => WalletsRepository)
        walletsRepository: IWalletsRepository,
    ) {
        this.transfersRepository = transfersRepository;
        this.walletsRepository = walletsRepository;
    }

    startTaskTransfer = async (
        task: ITaskDocument,
    ): Promise<ITransferDocument> => {
        //start session
        const session = await mongoose.startSession();
        try {
            session.startTransaction();
            const taskId = task.id;
            const customerId = task.customerId;
            const acceptedApplicants = task.applicants.filter(
                applicant => applicant.status === 'Accepted',
            ).length;
            const amount = Number(task.wages) * acceptedApplicants;
            // console.log(amount);
            //decrease amount of money from customer's wallet
            const updatedWallet = await this.walletsRepository.payStartTask(
                customerId,
                taskId,
                amount,
                session,
            );
            if (!updatedWallet) {
                throw new CustomerWalletNotFoundError('updatedWallet is null');
            }
            //increate amount of money of task's transfer
            const updatedTransfer =
                await this.transfersRepository.startTaskTransfer(
                    customerId,
                    taskId,
                    amount,
                    session,
                );
            if (!updatedTransfer) {
                throw new CannotTransferError('updatedTransfer is null');
            }
            //end session
            await session.commitTransaction();
            session.endSession();

            return updatedTransfer;
        } catch (error) {
            // Abort the transaction and end the session if an error occurs
            if (session && session.inTransaction()) {
                await session.abortTransaction();
            }
            session.endSession();

            if (error instanceof ValidationError)
                throw new ValidationError(error.message);
            else if (
                error instanceof NotEnoughMoneyError ||
                error instanceof CustomerWalletNotFoundError ||
                error instanceof CannotTransferError
            ) {
                throw error;
            } else {
                throw new Error('Unknown Error');
            }
        }
    };

    dismissInprogressTaskTransfer = async (
        task: ITaskDocument,
    ): Promise<ITransferDocument> => {
        //start session
        const session = await mongoose.startSession();
        try {
            session.startTransaction();
            const taskId = task.id;
            const customerId = task.customerId;
            const wage = Number(task.wages);
            //check amount in the task
            const taskTransfer =
                await this.transfersRepository.findOneByTaskId(taskId);
            if (!taskTransfer) {
                throw new TaskTransferNotFoundError('task transfer not found');
            }
            const taskAmount = taskTransfer.taskAmount;
            let workerCompensation = 0;
            let customerCompensation = 0;

            for (const worker of task.hiredWorkers) {
                if (
                    worker.status === 'Submitted' ||
                    worker.status === 'Revising' ||
                    worker.status === 'Resubmitted'
                ) {
                    workerCompensation += wage;
                    console.log('worker compensation', workerCompensation);
                } else if (worker.status === 'InProgress') {
                    workerCompensation += Math.round(0.3 * wage * 100) / 100;
                    console.log('worker compensation', workerCompensation);
                }
            }
            console.log('taskAmount', taskAmount);
            customerCompensation = taskAmount - workerCompensation;
            console.log(customerCompensation);
            if (customerCompensation < 0) {
                throw new NotEnoughMoneyInTaskTransfer(
                    'there is not enough money in task',
                );
            }
            //transfer money
            //task -> customer wallet
            //decrease money in task transfer
            await this.transfersRepository.taskPayment(
                customerId,
                taskId,
                customerCompensation,
                'CustomerRefund',
                session,
            );
            //increate money in customer wallet
            const updatedCustomerWallet =
                await this.walletsRepository.taskIncome(
                    customerId,
                    taskId,
                    customerCompensation,
                    'CustomerRefund',
                    session,
                );
            if (!updatedCustomerWallet) {
                throw new CustomerWalletNotFoundError('updatedWallet is null');
            }

            //task -> workers
            for (const worker of task.hiredWorkers) {
                if (
                    worker.status === 'Submitted' ||
                    worker.status === 'Revising' ||
                    worker.status === 'Resubmitted'
                ) {
                    //decrease money in task transfer
                    await this.transfersRepository.taskPayment(
                        worker.userId,
                        taskId,
                        wage,
                        'SubmittedWorkerCompensation',
                        session,
                    );
                    //increase money in user wallet
                    await this.walletsRepository.taskIncome(
                        worker.userId,
                        taskId,
                        wage,
                        'SubmittedCompensation',
                        session,
                    );
                } else if (worker.status === 'InProgress') {
                    //round with 2 floating point number
                    const compensation = Math.round(0.3 * wage * 100) / 100;
                    console.log('compensation', compensation);
                    //decrease money in task transfer
                    const updatedTransfer =
                        await this.transfersRepository.taskPayment(
                            worker.userId,
                            taskId,
                            compensation,
                            'NotSubmittedWorkerCompensation',
                            session,
                        );
                    console.log('transfer', updatedTransfer?.taskAmount);
                    //increase money in user wallet
                    await this.walletsRepository.taskIncome(
                        worker.userId,
                        taskId,
                        compensation,
                        'NotSubmittedCompensation',
                        session,
                    );
                }
            }
            //recheck that task's transfer amount = 0
            const updatedtaskTransfer =
                await this.transfersRepository.findOneByTaskId(
                    taskId.toString(),
                );
            if (!updatedtaskTransfer) {
                throw new TaskTransferNotFoundError('task transfer not found');
            }
            let updatedtaskAmount = updatedtaskTransfer.taskAmount;
            console.log(updatedtaskAmount);
            //if the amount is too small update it to 0
            if (updatedtaskAmount < 0.009) {
                updatedtaskAmount = 0;
                await this.transfersRepository.updateTaskAmount(
                    updatedtaskTransfer.id,
                    0,
                );
            }
            if (updatedtaskAmount != 0) {
                throw new NotCorrectAmountTransferError(
                    'money was not transfered correctly',
                );
            }
            //end session
            await session.commitTransaction();
            session.endSession();

            return updatedtaskTransfer;
        } catch (error) {
            // Abort the transaction and end the session if an error occurs
            if (session && session.inTransaction()) {
                await session.abortTransaction();
            }
            session.endSession();

            if (error instanceof ValidationError) {
                throw new ValidationError(error.message);
            } else {
                throw error;
            }
        }
    };

    //task -> worker 100 %
    acceptTaskPayment = async (
        taskId: string,
        workerId: string,
        wage: number,
    ): Promise<ITransferDocument> => {
        //start session
        const session = await mongoose.startSession();
        try {
            session.startTransaction();
            //check amount in the task
            const taskTransfer =
                await this.transfersRepository.findOneByTaskId(taskId);
            if (!taskTransfer) {
                throw new TaskTransferNotFoundError('task transfer not found');
            }
            const taskAmount = taskTransfer.taskAmount;
            if (taskAmount < wage) {
                throw new NotEnoughMoneyInTaskTransfer(
                    'amount of money in task is not enough',
                );
            }
            //decrease money in task transfer
            const workerIdObj = new mongoose.Types.ObjectId(workerId);
            const taskIdObj = new mongoose.Types.ObjectId(taskId);

            await this.transfersRepository.taskPayment(
                workerIdObj,
                taskIdObj,
                wage,
                'WorkerPayment',
                session,
            );
            //increase money in user wallet
            await this.walletsRepository.taskIncome(
                workerIdObj,
                taskIdObj,
                wage,
                'WageIncome',
                session,
            );
            const updatedtaskTransfer =
                await this.transfersRepository.findOneByTaskId(taskId);
            if (!updatedtaskTransfer) {
                throw new TaskTransferNotFoundError('task transfer not found');
            }
            //end session
            await session.commitTransaction();
            session.endSession();

            return updatedtaskTransfer;
        } catch (error) {
            // Abort the transaction and end the session if an error occurs
            if (session && session.inTransaction()) {
                await session.abortTransaction();
            }
            session.endSession();

            if (error instanceof ValidationError) {
                throw new ValidationError(error.message);
            } else {
                throw error;
            }
        }
    };
}
