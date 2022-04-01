"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProblemJsonError = void 0;
class ProblemJsonError extends Error {
    constructor(name, message, status, detail, additional) {
        super(message);
        this.name = name;
        this.message = message;
        this.status = status;
        this.detail = detail;
        this.additional = additional;
    }
    static fromTemplate(template, detail, additional) {
        return new ProblemJsonError(`https://stoplight.io/prism/errors#${template.type}`, template.title, template.status, detail || '', additional);
    }
    static toProblemJson(error) {
        return {
            type: error.name && error.name !== 'Error' ? error.name : 'https://stoplight.io/prism/errors#UNKNOWN',
            title: error.message,
            status: error.status || 500,
            detail: error.detail || '',
            ...error.additional,
        };
    }
}
exports.ProblemJsonError = ProblemJsonError;
