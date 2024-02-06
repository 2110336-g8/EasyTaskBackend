import { Inject, Service } from 'typedi';
import { BanksService, IBanksService } from '../services/BanksService';
import { Request, Response } from 'express';
import { ValidationError } from '../errors/RepoError';

@Service()
export class BanksController {
    private banksService: IBanksService;

    constructor(@Inject(() => BanksService) banksService: IBanksService) {
        this.banksService = banksService;
    }

    createBank = async (req: Request, res: Response) => {
        try {
            const data = req.body;
            const bank = await this.banksService.createBank(data);
            res.status(201).json({
                success: true,
                bank,
            });
        } catch (error) {
            console.error(error);
            this.handleError(res, error);
        }
    };

    getBank = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const bank = await this.banksService.getBank(id);
            if (!bank) {
                res.status(404).json({
                    error: 'Bank not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                bank,
            });
        } catch (error) {
            this.handleError(res, error);
        }
    };

    getBanks = async (req: Request, res: Response) => {
        try {
            const bank = await this.banksService.getBanks();
            res.status(200).json({
                success: true,
                bank,
            });
        } catch (error) {
            this.handleError(res, error);
        }
    };

    private handleError(res: Response, error: any) {
        if (error instanceof ValidationError) {
            res.status(400).json({
                error: error.name,
                details: error.message,
            });
        } else {
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }
}
