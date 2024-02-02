export class CannotSendEmailError extends Error {
    constructor(message: string = 'Unable to send email') {
        super(message);
        this.name = 'Cannot Send Email Error';
    }
}
