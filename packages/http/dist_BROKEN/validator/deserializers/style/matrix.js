"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserializeMatrixStyle = void 0;
const utils_1 = require("./utils");
function deserializeMatrixStyle(name, parameters, schema, explode = false) {
    const type = schema ? schema.type : 'undefined';
    if (!parameters[name].startsWith(';')) {
        throw new Error('Matrix serialization style requires parameter to be prefixed with ";"');
    }
    const value = parameters[name].substr(1);
    if (type === 'array') {
        return explode ? deserializeImplodeArray(name, value) : deserializeArray(name, value);
    }
    else if (type === 'object') {
        return explode ? deserializeImplodeObject(value) : deserializeObject(name, value);
    }
    else {
        return deserializePrimitive(name, value);
    }
}
exports.deserializeMatrixStyle = deserializeMatrixStyle;
function deserializePrimitive(name, value) {
    const prefix = name + '=';
    if (!value.startsWith(prefix)) {
        throw new Error('Matrix serialization style requires parameter to be prefixed with name');
    }
    return value.substr(prefix.length);
}
function deserializeArray(name, value) {
    const raw = deserializePrimitive(name, value);
    return raw === '' ? [] : raw.split(',');
}
function deserializeImplodeArray(name, value) {
    if (value === '') {
        return [];
    }
    return value.split(';').map(part => deserializePrimitive(name, part));
}
function deserializeImplodeObject(value) {
    return value.split(';').reduce((result, pair) => {
        const [k, v] = pair.split('=');
        return { ...result, [k]: v };
    }, {});
}
function deserializeObject(name, value) {
    return utils_1.createObjectFromKeyValList(deserializePrimitive(name, value).split(','));
}
