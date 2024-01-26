import mongoose, {Document} from 'mongoose';

export interface Token {
    token: string;
    expiry: string;
}
