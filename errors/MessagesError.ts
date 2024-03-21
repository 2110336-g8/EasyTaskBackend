export class CannotCreateMessageError extends Error {
    constructor(message: string = 'Unable to create message') {
        super(message);
        this.name = 'Cannot Create Message Error';
    }
}
