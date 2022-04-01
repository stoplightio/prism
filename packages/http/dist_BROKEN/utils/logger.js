"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.violationLogger = void 0;
const withLogger_1 = require("../withLogger");
const types_1 = require("@stoplight/types");
exports.violationLogger = withLogger_1.default(logger => {
    return (violation) => {
        const path = violation.path ? violation.path.join('.') + ' ' : '';
        const message = `Violation: ${path}${violation.message}`;
        if (violation.severity === types_1.DiagnosticSeverity.Error) {
            logger.error({ name: 'VALIDATOR' }, message);
        }
        else if (violation.severity === types_1.DiagnosticSeverity.Warning) {
            logger.warn({ name: 'VALIDATOR' }, message);
        }
        else {
            logger.info({ name: 'VALIDATOR' }, message);
        }
    };
});
