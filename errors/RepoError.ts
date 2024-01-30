export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "User Validation Error";
    }
}
