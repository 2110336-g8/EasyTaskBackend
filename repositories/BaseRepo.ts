import { Model, Document, Error as MongooseError } from 'mongoose';
import { ValidationError } from '../errors/RepoError';
import { MongoError } from 'mongodb';

export interface IRepository<T> {
    findOne(id: string): Promise<(T & Document) | null>;
    findAll(): Promise<(T & Document)[]>;
    create(item: T): Promise<T & Document>;
    update(id: string, item: T): Promise<(T & Document) | null>;
    deleteOne(id: string): Promise<boolean>;
}

export abstract class BaseMongooseRepository<T> implements IRepository<T> {
    protected readonly _model: Model<T & Document>;

    constructor(model: Model<T & Document>) {
        this._model = model;
    }

    async create(item: T): Promise<T & Document> {
        const item_w_id: Omit<T, '_id'> = item;
        try {
            const createdItem = await this._model.create(item_w_id);
            return createdItem;
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

    async update(id: string, item: T): Promise<(T & Document) | null> {
        try {
            const updatedItem = await this._model.findByIdAndUpdate(
                id,
                item as Model<T>,
                {
                    new: true,
                    runValidators: true,
                },
            );
            return updatedItem;
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

    async findOne(id: string): Promise<(T & Document) | null> {
        const item = await this._model.findById(id);
        return item;
    }

    async findAll(): Promise<(T & Document)[]> {
        const items = await this._model.find();
        return items;
    }
}
