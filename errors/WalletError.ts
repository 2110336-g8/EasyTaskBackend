export class NotEnoughMoneyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Not enough money in the customer wallet';
    }
}

export class CustomerWalletNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Cannot find customer wallet';
    }
}

export class UserWalletNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Cannot find user wallet';
    }
}
