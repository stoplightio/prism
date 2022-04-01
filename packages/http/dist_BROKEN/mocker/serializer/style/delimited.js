"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeWithPipeDelimitedStyle = exports.serializeWithSpaceDelimitedStyle = exports.serializeWithCommaDelimitedStyle = exports.serializeWithDelimitedStyle = void 0;
const lodash_1 = require("lodash");
function serializeAndImplode(separator, name, value) {
    return encodeURIComponent(name) + '=' + value.map(String).map(encodeURIComponent).join(separator);
}
function serializeAndExplode(name, value) {
    return value
        .map(String)
        .map(v => `${encodeURIComponent(name)}=${encodeURIComponent(v)}`)
        .join('&');
}
function serializeWithDelimitedStyle(separator, name, value, explode) {
    return explode ? serializeAndExplode(name, value) : serializeAndImplode(separator, name, value);
}
exports.serializeWithDelimitedStyle = serializeWithDelimitedStyle;
exports.serializeWithCommaDelimitedStyle = lodash_1.partial(serializeWithDelimitedStyle, ',');
exports.serializeWithSpaceDelimitedStyle = lodash_1.partial(serializeWithDelimitedStyle, ' ');
exports.serializeWithPipeDelimitedStyle = lodash_1.partial(serializeWithDelimitedStyle, '|');
