export class ValidationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ValidationError'
    }
}

export class UserNotFoundError extends Error {
    constructor(messege: string) {
        super(messege)
        this.name = 'UserNotFoundError'
    }
}