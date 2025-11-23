export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}


export class TrackerError extends Error {
    constructor(code, message) {
        super(message);
        this.name = "TrackerError";
        this.code = code;
        this.msg = message;
    }
}