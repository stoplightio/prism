"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserializeSimpleStyle = void 0;
const utils_1 = require("./utils");
function deserializeSimpleStyle(name, parameters, schema, explode) {
    const type = schema ? schema.type : 'undefined';
    const value = parameters[name];
    if (type === 'array') {
        return deserializeArray(value);
    }
    else if (type === 'object') {
        return explode ? deserializeImplodeObject(value) : deserializeObject(value);
    }
    else {
        return value;
    }
}
exports.deserializeSimpleStyle = deserializeSimpleStyle;
function deserializeArray(value) {
    return value === '' ? [] : value.split(',');
}
function deserializeImplodeObject(value) {
    return value.split(',').reduce((result, pair) => {
        const [k, v] = pair.split('=');
        return { ...result, [k]: v };
    }, {});
}
function deserializeObject(value) {
    return utils_1.createObjectFromKeyValList(value.split(','));
}
