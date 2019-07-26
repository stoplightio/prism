"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
function getOasParameters(operationParameters, pathParameters) {
    return lodash_1.unionBy(operationParameters, pathParameters, (parameter) => parameter && typeof parameter === 'object' ? `${parameter.name}-${parameter.in}` : 'invalid');
}
exports.getOasParameters = getOasParameters;
//# sourceMappingURL=accessors.js.map