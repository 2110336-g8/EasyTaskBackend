export class PathNotFoundError extends Error {
    constructor() {
        super('Unknown API Path');
        this.name = 'Path Not Found';
    }
}
