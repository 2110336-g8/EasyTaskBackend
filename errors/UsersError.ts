export class CannotCreateUserError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Cannot Create Error';
    }
}
