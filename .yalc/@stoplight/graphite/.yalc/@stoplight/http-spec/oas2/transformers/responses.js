"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const params_1 = require("./params");
const toObject = (value, key) => ({ key, value });
function translateToResponse(produces, response, statusCode) {
    const headers = params_1.translateToHeaderParams(response.headers || {});
    return {
        code: statusCode,
        description: response.description,
        headers,
        contents: produces.map(mediaType => ({
            mediaType,
            schema: response.schema,
            examples: lodash_1.map(response.examples, toObject).filter(example => example.key === mediaType),
        })),
    };
}
function translateToResponses(responses, produces) {
    return lodash_1.map(responses, lodash_1.partial(translateToResponse, produces));
}
exports.translateToResponses = translateToResponses;
//# sourceMappingURL=responses.js.map