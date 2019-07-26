"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const guards_1 = require("../guards");
const params_1 = require("./params");
function translateToRequest(parameters, consumes) {
    const bodyParameters = parameters.filter(parameter => guards_1.isBodyParameter(parameter));
    const formDataParameters = parameters.filter(parameter => guards_1.isFormDataParameter(parameter));
    const request = {};
    if (!!bodyParameters.length) {
        request.body = params_1.translateToBodyParameter(bodyParameters[0], consumes);
    }
    else if (!!formDataParameters.length) {
        request.body = params_1.translateFromFormDataParameter(formDataParameters, consumes);
    }
    return parameters.reduce(reduceRemainingParameters, request);
}
exports.translateToRequest = translateToRequest;
function reduceRemainingParameters(request, parameter) {
    if (guards_1.isQueryParameter(parameter)) {
        const queryParameter = params_1.translateToQueryParameter(parameter);
        request.query = (request.query || []).concat(queryParameter);
    }
    else if (guards_1.isPathParameter(parameter)) {
        const pathParameter = params_1.translateToPathParameter(parameter);
        request.path = (request.path || []).concat(pathParameter);
    }
    else if (guards_1.isHeaderParameter(parameter)) {
        const headerParameter = params_1.translateToHeaderParam(parameter);
        request.headers = (request.headers || []).concat(headerParameter);
    }
    return request;
}
//# sourceMappingURL=request.js.map