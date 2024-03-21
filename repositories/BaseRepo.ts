import {
    Model,
    Document,
    Error as MongooseError,
    ClientSession,
} from 'mongoose';
import { ValidationError } from '../errors/RepoError';
import { MongoError } from 'mongodb';

export interface IRepository<T> {
    _model: Model<T & Document>;
    findOne(id: string): Promise<(T & Document) | null>;
    findAll(): Promise<(T & Document)[]>;
    create(item: T): Promise<T & Document>;
    update(id: string, item: T): Promise<(T & Document) | null>;
    deleteOne(id: string): Promise<boolean>;
    startSession(): Promise<ClientSession>;
}

export abstract class BaseMongooseRepository<T> implements IRepository<T> {
    readonly _model: Model<T & Document>;

    constructor(model: Model<T & Document>) {
        this._model = model;
    }

    create = async (item: T): Promise<T & Document> => {
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
    };

    update = async (id: string, item: T): Promise<(T & Document) | null> => {
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
    };

    deleteOne = async (id: string): Promise<boolean> => {
        const result = await this._model.deleteOne({ _id: id });
        return result.deletedCount !== 0;
    };

    findOne = async (id: string): Promise<(T & Document) | null> => {
        const item = await this._model.findById(id);
        return item;
    };

    findAll = async (): Promise<(T & Document)[]> => {
        const items = await this._model.find();
        return items;
    };

    startSession = async (): Promise<ClientSession> => {
        return this._model.db.startSession();
    };
}
