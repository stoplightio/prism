"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
function getSecurities(spec, operationSecurity) {
    const globalSecurities = getSecurity(spec.security, spec.securityDefinitions || {});
    const operationSecurities = getSecurity(operationSecurity, spec.securityDefinitions || {});
    return !!operationSecurity ? operationSecurities : globalSecurities;
}
exports.getSecurities = getSecurities;
function getProduces(spec, operation) {
    return getProducesOrConsumes('produces', spec, operation);
}
exports.getProduces = getProduces;
function getConsumes(spec, operation) {
    return getProducesOrConsumes('consumes', spec, operation);
}
exports.getConsumes = getConsumes;
function getSecurity(security, definitions) {
    return lodash_1.flatten(lodash_1.map(security, sec => {
        return lodash_1.compact(lodash_1.map(Object.keys(sec), (key) => {
            const def = definitions[key];
            if (def) {
                const defCopy = lodash_1.merge({}, def);
                return defCopy;
            }
            return null;
        }));
    }));
}
function getProducesOrConsumes(which, spec, operation) {
    const mimeTypes = lodash_1.get(operation, which, lodash_1.get(spec, which, []));
    return mimeTypes.length ? mimeTypes : ['*/*'];
}
//# sourceMappingURL=accessors.js.map