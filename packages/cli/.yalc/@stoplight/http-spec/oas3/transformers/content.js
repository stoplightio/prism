"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("@stoplight/types");
const lodash_1 = require("lodash");
const toJsonSchema = require("openapi-schema-to-json-schema");
function translateEncodingPropertyObject(encodingPropertyObject, property) {
    const acceptableStyles = [
        types_1.HttpParamStyles.Form,
        types_1.HttpParamStyles.SpaceDelimited,
        types_1.HttpParamStyles.PipeDelimited,
        types_1.HttpParamStyles.DeepObject,
    ];
    if (encodingPropertyObject.style && !acceptableStyles.includes(encodingPropertyObject.style)) {
        throw new Error(`Encoding property style: '${encodingPropertyObject.style}' is incorrect, must be one of: ${acceptableStyles}`);
    }
    return Object.assign({ property }, encodingPropertyObject, { style: encodingPropertyObject.style, mediaType: encodingPropertyObject.contentType, headers: lodash_1.map(encodingPropertyObject.headers, translateHeaderObject) });
}
function translateHeaderObject(headerObject, name) {
    const { content: contentObject } = headerObject;
    const contentValue = lodash_1.values(contentObject)[0];
    const baseContent = Object.assign({}, lodash_1.omit(headerObject, 'content', 'style', 'examples', 'example', 'schema'), { name, style: headerObject.style || types_1.HttpParamStyles.Simple });
    const examples = [];
    const encodings = [];
    if (contentValue) {
        examples.push(...lodash_1.keys(contentValue.examples).map(transformExamples(contentValue)));
        encodings.push(...lodash_1.values(contentValue.encoding));
        if (contentValue.example) {
            examples.push({
                key: '__default_content',
                value: contentValue.example,
            });
        }
    }
    examples.push(...lodash_1.keys(headerObject.examples).map(transformExamples(headerObject)));
    if (headerObject.example) {
        examples.push({
            key: '__default',
            value: headerObject.example,
        });
    }
    return lodash_1.pickBy(Object.assign({}, baseContent, { schema: lodash_1.get(headerObject, 'schema'), encodings,
        examples }));
}
exports.translateHeaderObject = translateHeaderObject;
function translateMediaTypeObject({ schema, example, examples = {}, encoding }, mediaType) {
    return {
        mediaType,
        schema: schema ? toJsonSchema(schema, { cloneSchema: false }) : undefined,
        examples: lodash_1.compact(lodash_1.union(example ? [{ key: 'default', value: example }] : undefined, Object.keys(examples).map(exampleKey => ({
            key: exampleKey,
            value: examples[exampleKey].value,
        })))),
        encodings: lodash_1.map(encoding, translateEncodingPropertyObject),
    };
}
exports.translateMediaTypeObject = translateMediaTypeObject;
const transformExamples = (source) => (key) => {
    return {
        description: lodash_1.get(source, ['examples', key, 'description']),
        value: lodash_1.get(source, ['examples', key, 'value']),
        key,
    };
};
//# sourceMappingURL=content.js.map