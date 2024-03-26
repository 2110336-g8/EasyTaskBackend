export class CannotUpdateApplicationStatusError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Application Status Update Error';
    }
}
export class InvalidUpdateApplicationStatusError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Invalid Application Status Update';
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

export class CannotGetTaskOfError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Getting TaskOf Error';
    }
}
