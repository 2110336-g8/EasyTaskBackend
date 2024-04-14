import { Inject, Service } from 'typedi';
import dotenv from 'dotenv';
import {
    IWalletsRepository,
    WalletsRepository,
} from '../repositories/WalletsRepository';
import { IWalletDocument } from '../models/WalletModel';
import { ValidationError } from '../errors/RepoError';
dotenv.config({ path: './config/config.env' });

export interface IWalletsService {
    createWallet: (walletData: IWalletDocument) => Promise<IWalletDocument>;
    getWalletByUserId: (userId: string) => Promise<IWalletDocument | null>;
    addTopupHistory: (
        userId: string,
        amount: number,
        sessionId: string,
    ) => Promise<IWalletDocument | null>;
}

@Service()
export class WalletsService implements IWalletsService {
    private walletsRepository: IWalletsRepository;

    constructor(
        @Inject(() => WalletsRepository)
        walletsRepository: IWalletsRepository,
    ) {
        this.walletsRepository = walletsRepository;
    }

    createWallet = async (
        walletData: IWalletDocument,
    ): Promise<IWalletDocument> => {
        try {
            const createdWallet =
                await this.walletsRepository.create(walletData);
            return createdWallet;
        } catch (error) {
            if (error instanceof ValidationError)
                throw new ValidationError(error.message);
            else {
                throw new Error('Unknown Error');
            }
        }
    };

    getWalletByUserId = async (
        userId: string,
    ): Promise<IWalletDocument | null> => {
        try {
            const wallet = await this.walletsRepository.findOneByUserId(userId);
            if (wallet) return wallet;
            return null;
        } catch (error) {
            throw error;
        }
    };

    addTopupHistory = async (
        userId: string,
        amount: number,
        sessionId: string,
    ): Promise<IWalletDocument | null> => {
        try {
            const wallet = await this.walletsRepository.addTopupHistory(
                userId,
                amount,
                sessionId,
            );
            if (wallet) return wallet;
            return null;
        } catch (error) {
            throw error;
        }
    };
}
