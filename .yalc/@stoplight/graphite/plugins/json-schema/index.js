"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const graph_1 = require("../../graph");
const KNOWN_JSON_SCHEMA_TYPES = [
    'any',
    'array',
    'boolean',
    'integer',
    'null',
    'number',
    'object',
    'string',
];
const predicates = [
    (parsed) => parsed.$schema && parsed.$schema.match('json-schema'),
    (parsed) => parsed.type && KNOWN_JSON_SCHEMA_TYPES.includes(parsed.type),
    (parsed) => lodash_1.some(['allOf', 'oneOf', 'anyOf'], (prop) => Array.isArray(parsed[prop])),
];
exports.createJsonSchemaPlugin = () => {
    return {
        tasks: [],
        specProvider: {
            spec: graph_1.Specs.Json_Schema,
            path: /\.schema\.(json|ya?ml)$/i,
            content(parsed) {
                if (!parsed)
                    return 0;
                return lodash_1.some(predicates, (predicate) => predicate(parsed)) ? 1 : 0;
            },
        },
    };
};
//# sourceMappingURL=index.js.map