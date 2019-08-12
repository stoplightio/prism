"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const content_1 = require("./content");
function translateToResponse(response, statusCode) {
    return {
        code: statusCode,
        description: response.description,
        headers: lodash_1.map(response.headers, content_1.translateHeaderObject),
        contents: lodash_1.map(response.content, content_1.translateMediaTypeObject),
    };
}
function translateToResponses(responses) {
    return lodash_1.map(responses, translateToResponse);
}
exports.translateToResponses = translateToResponses;
//# sourceMappingURL=responses.js.map