"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserializeLabelStyle = void 0;
const utils_1 = require("./utils");
function deserializeLabelStyle(name, parameters, schema, explode = false) {
    const type = schema ? schema.type : 'undefined';
    if (!parameters[name].startsWith('.')) {
        throw new Error('Label serialization style requires parameter to be prefixed with "."');
    }
    const value = parameters[name].substr(1);
    if (type === 'array') {
        return deserializeArray(value, explode);
    }
    else if (type === 'object') {
        return explode ? deserializeImplodeObject(value) : deserializeObject(value);
    }
    else {
        return value;
    }
}
exports.deserializeLabelStyle = deserializeLabelStyle;
function deserializeArray(value, explode) {
    return value === '' ? [] : value.split(explode ? '.' : ',');
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
