import { Service } from 'typedi';
import { IBank } from '../models/BankModel';
import data from '../assets/banks/bankslist.json';
import { convertImageToBase64 } from '../utils/util';
import { CannotConvertImgError } from '../errors/UtilsError';

export interface IBanksService {
    getBank: (id: string) => Promise<IBank | null>;
    getBanks: () => Promise<IBank[]>;
}

@Service()
export class BanksService implements IBanksService {
    getBank = async (id: string): Promise<IBank | null> => {
        try {
            const bank = data.banks.find(bank => bank.id === id);
            if (!bank) return null;

            const imgPath = bank.imgPath;
            try {
                const base64Image = await convertImageToBase64(imgPath);
                return {
                    id: bank.id,
                    name: bank.name,
                    url: 'data:image/png;base64,' + base64Image,
                };
            } catch (error) {
                throw error;
            }
        } catch (error) {
            return null;
        }
    };

    getBanks = async (): Promise<IBank[]> => {
        try {
            const banks: IBank[] = await Promise.all(
                data.banks.map(async bank => {
                    const imgPath = bank.imgPath;
                    try {
                        const base64Image = await convertImageToBase64(imgPath);
                        return {
                            id: bank.id,
                            name: bank.name,
                            url: 'data:image/png;base64,' + base64Image,
                        };
                    } catch (error) {
                        throw error;
                    }
                }),
            );
            return banks;
        } catch (error) {
            return [];
        }
    };
}
