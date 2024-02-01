import { QueryOptions } from 'mongoose';

export interface IRead<T> {
    find(item: QueryOptions<T>): Promise<T[]>;
    findOne(item: QueryOptions<T>): Promise<T | null>;
}
