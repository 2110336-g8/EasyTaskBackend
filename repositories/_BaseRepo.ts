import { Model, QueryOptions, Error as MongooseError } from 'mongoose'
import { IRead } from '../interfaces/IRead'
import { IWrite } from '../interfaces/IWrite'
import { ValidationError } from '../errors/RepoError'
import { MongoError } from 'mongodb'

export abstract class BaseMongooseRepository<T> implements IRead<T>, IWrite<T> {
    protected readonly _model: Model<T>

    constructor(model: Model<T>) {
        this._model = model
    }

    async create(item: T): Promise<T> {
        const item_w_id: Omit<T, '_id'> = item
        try {
            const createdItem = await this._model.create(item_w_id)
            return createdItem.toJSON()
        } catch (error) {
            if (error instanceof MongooseError.ValidationError) {
                throw new ValidationError(error.message)
            } else if ((error as MongoError).code == 11000) {
                throw new ValidationError((error as MongoError).message)
            } else if (error instanceof ValidationError) {
                throw error
            } else {
                throw new Error('Unknown Error')
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
            )
            return updatedItem ? updatedItem.toJSON() : null
        } catch (error) {
            if (error instanceof MongooseError.ValidationError) {
                throw new ValidationError(error.message)
            } else if ((error as MongoError).code == 11000) {
                throw new ValidationError((error as MongoError).message)
            } else {
                throw new Error('Unknown Error')
            }
        }
    }

    async deleteOne(id: string): Promise<boolean> {
        const result = await this._model.deleteOne({ _id: id })
        return result.deletedCount !== 0
    }

    async find(query: QueryOptions<T>): Promise<T[]> {
        const items = await this._model.find(query)
        return items as T[]
    }

    async findOne(query: QueryOptions<T>): Promise<T | null> {
        const item = await this._model.findOne(query)
        return item ? (item as T) : null
    }
}
