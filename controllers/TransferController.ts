import { Request, Response } from 'express';
import { Inject, Service } from 'typedi';
import { ITaskDocument } from '../models/TaskModel';
import {
    ITransfersService,
    TransfersService,
} from '../services/TransfersService';
import { ITransferDocument } from '../models/TransferModel';

@Service()
class TransferController {
    private transferService: ITransfersService;

    constructor(
        @Inject(() => TransfersService) transferService: ITransfersService,
    ) {
        this.transferService = transferService;
    }

    startTaskTransfer = async (req: Request, res: Response) => {
        try {
            const task: ITaskDocument = req.body.task; // Assuming task is included in the request body
            const transfer: ITransferDocument =
                await this.transferService.startTaskTransfer(task);
            res.status(200).json({ success: true, transfer });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    };

    dismissInprogressTaskTransfer = async (req: Request, res: Response) => {
        try {
            const task: ITaskDocument = req.body.task; // Assuming task is included in the request body
            const transfer: ITransferDocument =
                await this.transferService.dismissInprogressTaskTransfer(task);
            res.status(200).json({ success: true, transfer });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    };

    acceptTaskPayment = async (req: Request, res: Response) => {
        try {
            const taskId: string = req.body.taskId; // Assuming taskId is included in the request body
            const workerId: string = req.body.workerId; // Assuming workerId is included in the request body
            const wage: number = req.body.wage; // Assuming wage is included in the request body
            const transfer: ITransferDocument =
                await this.transferService.acceptTaskPayment(
                    taskId,
                    workerId,
                    wage,
                );
            res.status(200).json({ success: true, transfer });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
}
export default TransferController;
