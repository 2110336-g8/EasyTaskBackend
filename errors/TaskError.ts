export class CannotGetTaskOfError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Getting TaskOf Error';
    }
}

export class CannotUpdateStateError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Application/Task Status Update Error';
    }
}

export class CannotApplyTaskError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Task Application Error';
    }
}

export class CannotSelectCandidateError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Candidate Selection Error';
    }
}

export class CannotResponseOfferError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Offer Response Error';
    }
}

export class CannotStartTaskError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Task Start Error';
    }
}

export class CannotDismissTaskError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Task Cancellation Error';
    }
}

export class CannotSubmitTaskError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Task Cancellation Error';
    }
}

export class CannotAcceptTaskError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Task Acception Error';
    }
}

export class CannotRequestRevisionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Revision Request Error';
    }
}
