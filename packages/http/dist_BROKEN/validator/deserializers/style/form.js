"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserializeFormStyle = void 0;
const utils_1 = require("./utils");
function deserializeFormStyle(name, parameters, schema, explode = true) {
    const type = schema ? schema.type : undefined;
    const values = parameters[name];
    if (!values)
        return undefined;
    if (type === 'array') {
        return explode ? deserializeImplodeArray(values) : deserializeArray(values);
    }
    else if (type === 'object') {
        return explode ? deserializeImplodeObject(parameters, schema || {}) : deserializeObject(values);
    }
    else {
        return values;
    }
}
exports.deserializeFormStyle = deserializeFormStyle;
function deserializeImplodeArray(value) {
    return Array.isArray(value) ? value : [value];
}
function deserializeArray(value) {
    if (Array.isArray(value)) {
        value = value[value.length - 1];
    }
    return value.split(',');
}
function deserializeImplodeObject(parameters, schema) {
    const properties = schema.properties || {};
    return Object.keys(parameters).reduce((result, key) => {
        const value = parameters[key];
        if (!Object.prototype.hasOwnProperty.call(properties, key)) {
            return result;
        }
        return { ...result, [key]: value };
    }, {});
}
function deserializeObject(value) {
    if (Array.isArray(value)) {
        value = value[value.length - 1];
    }
    return utils_1.createObjectFromKeyValList(value.split(','));
}
