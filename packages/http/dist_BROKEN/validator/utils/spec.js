"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findOperationResponse = void 0;
const Array_1 = require("fp-ts/Array");
function findOperationResponse(responseSpecs, statusCode) {
    const sortedSpecs = responseSpecs
        .filter(spec => new RegExp(`^${spec.code.replace(/X/g, '\\d')}$`).test(String(statusCode)) || spec.code === 'default')
        .sort((s1, s2) => {
        if (s1.code === 'default') {
            return 1;
        }
        if (s2.code === 'default') {
            return -1;
        }
        return s1.code.split('X').length - s2.code.split('X').length;
    });
    return Array_1.head(sortedSpecs);
}
exports.findOperationResponse = findOperationResponse;
