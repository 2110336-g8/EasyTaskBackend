import { Service } from 'typedi';
import { IBank } from '../models/BankModel';
import data from '../assets/banks/bankslist.json';
import { convertImageToBase64 } from '../utils/util';

export interface IBanksService {
    getBank: (id: string) => Promise<IBank | null>;
    getBanks: () => Promise<IBank[]>;
}

@Service()
export class BanksService implements IBanksService {

    async getBank(id: string): Promise<IBank | null> {
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
                console.error(
                    `Error converting image to base64 for bank with ID ${bank.id}:`,
                    error,
                );
                throw error;
            }
        } catch (error) {
            console.error('Error fetching bank:', error);
            throw error;
        }
    }

    async getBanks(): Promise<IBank[]> {
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
                        console.error(
                            `Error converting image to base64 for bank with ID ${bank.id}:`,
                            error,
                        );
                        throw error;
                    }
                }),
            );
            return banks;
        } catch (error) {
            console.error('Error fetching banks:', error);
            throw error;
        }
    }
}
