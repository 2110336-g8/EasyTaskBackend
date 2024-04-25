import { Inject, Service } from 'typedi';
import dotenv from 'dotenv';
import {
    IWalletsRepository,
    WalletsRepository,
} from '../repositories/WalletsRepository';
import { IWalletDocument } from '../models/WalletModel';
import { ValidationError } from '../errors/RepoError';
import { Types } from 'mongoose';
dotenv.config({ path: './config/config.env' });

export interface IWalletsService {
    createWallet: (walletData: IWalletDocument) => Promise<IWalletDocument>;
    getWalletByUserId: (userId: string) => Promise<IWalletDocument | null>;
    addTopupHistory: (
        userId: string,
        amount: number,
        sessionId: string,
    ) => Promise<IWalletDocument | null>;
    getWalletHistory: (
        userId: string,
        page: number,
        limit: number,
    ) => Promise<{
        walletHistory: IWalletDocument['paymentHistory'];
        count: number;
    }>;
    createMissingWallet: (userId: string) => Promise<boolean | null>;
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

    getWalletHistory = async (
        userId: string,
        page: number,
        limit: number,
    ): Promise<{
        walletHistory: IWalletDocument['paymentHistory'];
        count: number;
    }> => {
        try {
            const walletHistory = await this.walletsRepository.getWalletHistory(
                userId,
                page,
                limit,
            );
            if (walletHistory) return walletHistory;
            return { walletHistory: [], count: 0 };
        } catch (error) {
            throw error;
        }
    };

    createMissingWallet = async (userId: string): Promise<boolean | null> => {
        try {
            // Check if a wallet exists for the provided user ID
            const existingWallet = await this.getWalletByUserId(userId);
            if (existingWallet) {
                return true;
            } else {
                // If no wallet exists, create a new wallet for the user
                const newWalletData = {
                    userId: new Types.ObjectId(userId),
                    walletAmount: 0,
                } as IWalletDocument;
                await this.walletsRepository.create(newWalletData);
                return true;
            }
        } catch (error) {
            throw new Error('Error while fetching or creating wallet');
        }
    };
}
