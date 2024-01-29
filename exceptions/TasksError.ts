import mongoose from 'mongoose'

export class TaskValidationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'TaskValidationError'
    }
}
