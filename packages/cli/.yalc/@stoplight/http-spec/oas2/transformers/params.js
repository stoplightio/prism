"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("@stoplight/types");
const lodash_1 = require("lodash");
function chooseQueryParameterStyle(parameter) {
    switch (parameter.collectionFormat) {
        case 'pipes':
            return types_1.HttpParamStyles.PipeDelimited;
        case 'ssv':
            return types_1.HttpParamStyles.SpaceDelimited;
        case 'csv':
        case 'multi':
        default:
            return types_1.HttpParamStyles.Form;
    }
}
function translateToHeaderParam(parameter) {
    return lodash_1.pickBy(Object.assign({}, buildSchemaForParameter(parameter), { name: parameter.name, style: types_1.HttpParamStyles.Simple, required: parameter.required }));
}
exports.translateToHeaderParam = translateToHeaderParam;
function translateToHeaderParams(headers) {
    return lodash_1.map(headers, (header, name) => {
        const param = Object.assign({}, buildSchemaForParameter(Object.assign({ name }, header)), { name, style: types_1.HttpParamStyles.Simple });
        return param;
    });
}
exports.translateToHeaderParams = translateToHeaderParams;
function translateToBodyParameter(body, consumes) {
    const examples = lodash_1.map(lodash_1.get(body, 'x-examples'), (value, key) => ({ key, value }));
    return lodash_1.pickBy({
        description: body.description,
        required: body.required,
        contents: consumes.map(mediaType => {
            return {
                mediaType,
                schema: body.schema,
                examples,
            };
        }),
    });
}
exports.translateToBodyParameter = translateToBodyParameter;
function translateFromFormDataParameters(parameters, consumes) {
    const finalBody = {
        contents: consumes.map(mediaType => ({
            mediaType,
            schema: {
                type: 'object',
            },
        })),
    };
    return parameters.reduce((body, parameter) => {
        const { schema } = buildSchemaForParameter(parameter);
        (body.contents || []).forEach(content => {
            if ('allowEmptyValue' in parameter) {
                Object.assign(schema, { allowEmptyValue: parameter.allowEmptyValue });
            }
            lodash_1.set(content, `schema.properties.${parameter.name}`, schema);
            if (parameter.required) {
                const requiredIndex = lodash_1.get(content, 'schema.required.length', 0);
                lodash_1.set(content, `schema.required.${requiredIndex}`, parameter.name);
            }
            if (parameter.collectionFormat) {
                content.encodings = content.encodings || [];
                const encoding = buildEncoding(parameter);
                if (encoding) {
                    content.encodings.push(encoding);
                }
            }
        });
        return body;
    }, finalBody);
}
exports.translateFromFormDataParameters = translateFromFormDataParameters;
function buildEncoding(parameter) {
    switch (parameter.collectionFormat) {
        case 'csv':
            return {
                property: parameter.name,
                style: types_1.HttpParamStyles.Form,
                explode: false,
            };
        case 'pipes':
            return {
                property: parameter.name,
                style: types_1.HttpParamStyles.PipeDelimited,
                explode: false,
            };
        case 'multi':
            return {
                property: parameter.name,
                style: types_1.HttpParamStyles.Form,
                explode: true,
            };
        case 'ssv':
            return {
                property: parameter.name,
                style: types_1.HttpParamStyles.SpaceDelimited,
                explode: false,
            };
    }
    return null;
}
function translateToQueryParameter(query) {
    return lodash_1.pickBy(Object.assign({}, buildSchemaForParameter(query), { allowEmptyValue: query.allowEmptyValue, name: query.name, style: chooseQueryParameterStyle(query), required: query.required }));
}
exports.translateToQueryParameter = translateToQueryParameter;
function translateToPathParameter(parameter) {
    return lodash_1.pickBy(Object.assign({}, buildSchemaForParameter(parameter), { name: parameter.name, style: types_1.HttpParamStyles.Simple, required: parameter.required }));
}
exports.translateToPathParameter = translateToPathParameter;
function buildSchemaForParameter(param) {
    const schema = lodash_1.pick(param, 'type', 'format', 'default', 'description', 'enum', 'exclusiveMaximum', 'exclusiveMinimum', 'maxItems', 'maxLength', 'maximum', 'minItems', 'minimum', 'minLength', 'title', 'items', 'pattern', 'uniqueItems', 'multipleOf');
    if ('allowEmptyValue' in param && param.allowEmptyValue) {
        schema.minLength = 1;
    }
    return { schema };
}
//# sourceMappingURL=params.js.map