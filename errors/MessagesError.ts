export class CannotCreateMessageError extends Error {
    constructor(message: string = 'Unable to create message') {
        super(message);
        this.name = 'Cannot Create Message Error';
    }
}

export class CannotJoinRoomError extends Error {
    constructor(message: string = 'Unable to join room') {
        super(message);
        this.name = 'Cannot Join Room Error';
    }
}
