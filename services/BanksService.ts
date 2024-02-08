import { Inject, Service } from 'typedi';
import { IBank, IBankDocument } from '../models/BankModel';
import { BanksRepository, IBanksRepository } from '../repositories/BanksRepo';
import { ValidationError } from '../errors/RepoError';

export interface IBanksService {
    createBank: (data: IBank) => Promise<IBankDocument>;
    getBank: (id: string) => Promise<IBankDocument | null>;
    getBanks: () => Promise<IBankDocument[]>;
}

@Service()
export class BanksService implements IBanksService {
    private banksRepository: IBanksRepository;
    constructor(
        @Inject(() => BanksRepository) banksRepository: IBanksRepository,
    ) {
        this.banksRepository = banksRepository;
    }

    async createBank(data: IBank): Promise<IBankDocument> {
        try {
            const bank = await this.banksRepository.create(data);
            return bank;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new Error('Unknown Error');
        }
    }

    async getBank(id: string): Promise<IBankDocument | null> {
        try {
            const bank = await this.banksRepository.findOne(id);
            return bank;
        } catch (error) {
            return null;
        }
    }

    async getBanks(): Promise<IBankDocument[]> {
        try {
            const bank = await this.banksRepository.findAll();
            return bank;
        } catch (error) {
            return [];
        }
    }
}
