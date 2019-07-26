"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isBodyParameter(parameter) {
    return parameter.in === 'body';
}
exports.isBodyParameter = isBodyParameter;
function isFormDataParameter(parameter) {
    return parameter.in === 'formData';
}
exports.isFormDataParameter = isFormDataParameter;
function isQueryParameter(parameter) {
    return parameter.in === 'query';
}
exports.isQueryParameter = isQueryParameter;
function isPathParameter(parameter) {
    return parameter.in === 'path';
}
exports.isPathParameter = isPathParameter;
function isHeaderParameter(parameter) {
    return parameter.in === 'header';
}
exports.isHeaderParameter = isHeaderParameter;
//# sourceMappingURL=guards.js.map