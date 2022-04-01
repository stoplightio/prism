"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripWriteOnlyProperties = exports.stripReadOnlyProperties = void 0;
const function_1 = require("fp-ts/function");
const O = require("fp-ts/Option");
const A = require("fp-ts/Array");
const buildSchemaFilter = (keepPropertyPredicate) => {
    function filterProperties(schema) {
        return function_1.pipe(O.fromNullable(schema.properties), O.map(properties => function_1.pipe(Object.keys(properties), A.reduce({}, (filteredProperties, propertyName) => {
            return function_1.pipe(properties[propertyName], O.fromPredicate(p => {
                if (typeof p === 'boolean') {
                    filteredProperties[propertyName] = properties[propertyName];
                    return false;
                }
                return true;
            }), O.chain(p => filter(p)), O.map(v => ({ ...filteredProperties, [propertyName]: v })), O.fold(() => filteredProperties, v => v));
        }))), O.map(filteredProperties => ({
            ...schema,
            properties: filteredProperties,
        })), O.alt(() => O.some(schema)));
    }
    function filterRequired(updatedSchema, originalSchema) {
        return function_1.pipe(updatedSchema, O.fromPredicate((schema) => Array.isArray(schema.required)), O.map(schema => Object.keys(schema.properties || {})), O.map(updatedProperties => {
            const originalPropertyNames = Object.keys(originalSchema.properties || {});
            return originalPropertyNames.filter(name => !updatedProperties.includes(name));
        }), O.map(removedProperties => originalSchema.required.filter(name => !removedProperties.includes(name))), O.map(required => {
            return {
                ...updatedSchema,
                required,
            };
        }), O.alt(() => O.some(updatedSchema)));
    }
    function filter(inputSchema) {
        return function_1.pipe(inputSchema, keepPropertyPredicate, O.chain(inputSchema => filterProperties(inputSchema)), O.chain(schema => filterRequired(schema, inputSchema)));
    }
    return filter;
};
exports.stripReadOnlyProperties = buildSchemaFilter(O.fromPredicate((schema) => schema.readOnly !== true));
exports.stripWriteOnlyProperties = buildSchemaFilter(O.fromPredicate((schema) => schema.writeOnly !== true));
