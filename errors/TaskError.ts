export class CannotApplyTaskError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Cannot Apply Task Error';
    }
}
