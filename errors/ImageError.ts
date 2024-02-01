export class CannotCreateImageError extends Error {
    constructor(message: string = 'Unable to create image') {
        super(message)
        this.name = 'Validation Error'
    }
}
export class CannotGetImageError extends Error {
    constructor(message: string = 'Unable to get image') {
        super(message)
        this.name = 'Validation Error'
    }
}
export class CannotDeleteImageError extends Error {
    constructor(message: string = 'Unable to delete image') {
        super(message)
        this.name = 'Validation Error'
    }
}
