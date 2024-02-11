export class CannotConvertImgError extends Error {
    constructor(message: string = 'Unable to convert image') {
        super(message);
        this.name = 'Cannot Convert Image Error';
    }
}
