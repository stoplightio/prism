"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const accessors_1 = require("../oas/accessors");
const tag_1 = require("../oas/tag");
const accessors_2 = require("./accessors");
const request_1 = require("./transformers/request");
const responses_1 = require("./transformers/responses");
const securities_1 = require("./transformers/securities");
const servers_1 = require("./transformers/servers");
function computeOas3Operations(spec) {
    return [];
}
exports.computeOas3Operations = computeOas3Operations;
exports.transformOas3Operation = ({ document, path, method }) => {
    const pathObj = lodash_1.get(document, ['paths', path]);
    if (!pathObj) {
        throw new Error(`Could not find ${['paths', path].join('/')} in the provided spec.`);
    }
    const operation = lodash_1.get(document, ['paths', path, method]);
    if (!operation) {
        throw new Error(`Could not find ${['paths', path, method].join('/')} in the provided spec.`);
    }
    const httpOperation = {
        id: '?http-operation-id?',
        iid: operation.operationId,
        description: operation.description,
        deprecated: operation.deprecated,
        method,
        path,
        summary: operation.summary,
        responses: responses_1.translateToResponses(operation.responses),
        servers: servers_1.translateToServers(operation.servers || pathObj.servers || document.servers),
        request: request_1.translateToRequest(accessors_1.getOasParameters(operation.parameters, pathObj.parameters), operation.requestBody),
        tags: tag_1.translateToTags(operation.tags || []),
        security: securities_1.translateToSecurities(accessors_2.getSecurities(document, operation)),
    };
    return lodash_1.omitBy(httpOperation, lodash_1.isNil);
};
//# sourceMappingURL=operation.js.map