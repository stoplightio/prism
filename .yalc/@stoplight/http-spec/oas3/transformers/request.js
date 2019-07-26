"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const content_1 = require("./content");
function translateRequestBody(requestBodyObject) {
    return {
        required: requestBodyObject.required,
        description: requestBodyObject.description,
        contents: lodash_1.map(requestBodyObject.content, content_1.translateMediaTypeObject),
    };
}
function translateParameterObject(parameterObject) {
    return lodash_1.pickBy(Object.assign({}, lodash_1.omit(parameterObject, 'in', 'schema'), { name: parameterObject.name, style: parameterObject.style, schema: parameterObject.schema, examples: lodash_1.map(parameterObject.examples, (example, key) => (Object.assign({ key }, example))) }));
}
function translateToRequest(parameters, requestBodyObject) {
    const params = {
        header: [],
        query: [],
        cookie: [],
        path: [],
    };
    for (const parameter of parameters) {
        const { in: key } = parameter;
        if (!params.hasOwnProperty(key))
            continue;
        params[key].push(translateParameterObject(parameter));
    }
    const body = requestBodyObject ? translateRequestBody(requestBodyObject) : { contents: [] };
    return {
        body,
        headers: params.header,
        query: params.query,
        cookie: params.cookie,
        path: params.path,
    };
}
exports.translateToRequest = translateToRequest;
//# sourceMappingURL=request.js.map