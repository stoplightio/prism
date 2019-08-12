"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const utils_1 = require("../utils");
function getSecurities(spec, operation) {
    const globalSchemes = utils_1.uniqFlatMap(spec.security);
    const operationSchemes = utils_1.uniqFlatMap(operation.security);
    const opSchemesPairs = operation.security ? operationSchemes : globalSchemes;
    const definitions = lodash_1.get(spec, 'components.securitySchemes');
    return opSchemesPairs.map((opSchemePair) => {
        return opSchemePair.map((opScheme) => {
            return definitions[opScheme];
        });
    });
}
exports.getSecurities = getSecurities;
//# sourceMappingURL=accessors.js.map