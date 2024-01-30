export class ValidationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'Validation Error'
    }
}

export class NotFoundError extends Error {
    constructor(message: string = 'The provided id or query has no data') {
        super(message)
        this.name = 'Data Not Found'
    }
}
