import { Model, QueryOptions, Error as MongooseError } from 'mongoose';
import { ValidationError } from '../errors/RepoError';
import { MongoError } from 'mongodb';

export interface IRepository<T> {
    findOne(id: string): Promise<T | null>;
    getAll(): Promise<T[]>;
    create(item: T): Promise<T>;
    update(id: string, item: T): Promise<T | null>;
    deleteOne(id: string): Promise<boolean>;
}

export abstract class BaseMongooseRepository<T> implements IRepository<T> {
    protected readonly _model: Model<T>;

    constructor(model: Model<T>) {
        this._model = model;
    }

    async create(item: T): Promise<T> {
        const item_w_id: Omit<T, '_id'> = item;
        try {
            const createdItem = await this._model.create(item_w_id);
            return createdItem.toJSON();
        } catch (error) {
            if (error instanceof MongooseError.ValidationError) {
                throw new ValidationError(error.message);
            } else if ((error as MongoError).code == 11000) {
                throw new ValidationError((error as MongoError).message);
            } else if (error instanceof ValidationError) {
                throw error;
            } else {
                throw new Error('Unknown Error');
            }
        }
    }

    async update(id: string, item: T): Promise<T | null> {
        try {
            const updatedItem = await this._model.findByIdAndUpdate(
                id,
                item as Model<T>,
                {
                    new: true,
                    runValidators: true,
                },
            );
            return updatedItem ? updatedItem.toJSON() : null;
        } catch (error) {
            if (error instanceof MongooseError.ValidationError) {
                throw new ValidationError(error.message);
            } else if ((error as MongoError).code == 11000) {
                throw new ValidationError((error as MongoError).message);
            } else {
                throw new Error('Unknown Error');
            }
        }
    }

    async deleteOne(id: string): Promise<boolean> {
        const result = await this._model.deleteOne({ _id: id });
        return result.deletedCount !== 0;
    }

    async findOne(id: string): Promise<T | null> {
        const item = await this._model.findById(id);
        return item ? (item as T) : null;
    }

    async getAll(): Promise<T[]> {
        const items = await this._model.find();
        return items as T[];
    }
}
