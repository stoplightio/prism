"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDelimitedDeserializerStyle = void 0;
function createDelimitedDeserializerStyle(separator) {
    function deserializeImplodeArray(value) {
        return Array.isArray(value) ? value : [value];
    }
    function deserializeArray(value) {
        if (Array.isArray(value)) {
            value = value[value.length - 1];
        }
        return value ? value.split(separator) : '';
    }
    return function deserialize(name, parameters, schema, explode = false) {
        const type = schema ? schema.type : undefined;
        const values = parameters[name];
        if (type === 'array') {
            return explode ? deserializeImplodeArray(values) : deserializeArray(values);
        }
        else {
            throw new Error('Space/pipe/comma.. delimited style is only applicable to array parameter');
        }
    };
}
exports.createDelimitedDeserializerStyle = createDelimitedDeserializerStyle;
