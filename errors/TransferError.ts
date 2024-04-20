export class CannotTransferError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Error during the transfer';
    }
}

export class TaskTransferNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'task transfer not found error';
    }
}

export class NotEnoughMoneyInTaskTransfer extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'something went wrong with the total amount money';
    }
}

export class NotCorrectAmountTransferError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'the money was not transfered correctly';
    }
}
