export class UserValidationError extends Error {
    constructor(message: string = "Invalid data") {
        super(message);
        this.name = "ValidationError";
    }
}

export class UserNotFoundError extends Error {
    constructor(messege: string = "User not found") {
        super(messege);
        this.name = "UserNotFoundError";
    }
}
