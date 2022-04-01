"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeWithDeepObjectStyle = void 0;
function serializeWithDeepObjectStyle(name, value) {
    return serialize(name, [], value);
}
exports.serializeWithDeepObjectStyle = serializeWithDeepObjectStyle;
function serialize(name, path, value) {
    if (typeof value === 'object') {
        return Object.keys(value)
            .map(key => serialize(name, [...path, isPositiveInteger(key) ? '' : key], value[key]))
            .join('&');
    }
    else {
        return `${name}${path.map(key => `[${key}]`).join('')}=${value}`;
    }
}
function isPositiveInteger(str) {
    return /^\+?\d+$/.test(str) && parseInt(str) >= 0;
}
