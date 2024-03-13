export class CannotApplyTaskError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Task Application Error';
    }
}

export class CannotCancelTaskError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Task Cancellation Error';
    }
}
