export class CannotCreateOtpError extends Error {
    constructor(message: string = 'Unable to create otp for this email') {
        super(message);
        this.name = 'Cannot Create OTP Error';
    }
}
