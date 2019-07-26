"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
function translateToSecurities(securities) {
    return securities.map(transformToSingleSecurity);
}
exports.translateToSecurities = translateToSecurities;
function transformToSingleSecurity(securityScheme) {
    const baseObject = {
        name: securityScheme.name,
        description: securityScheme.description,
        in: securityScheme.in,
        type: securityScheme.type,
    };
    if (securityScheme.flows) {
        Object.assign(baseObject, {
            flows: (securityScheme.flows && transformFlows(securityScheme.flows)) || {},
        });
    }
    if (securityScheme.openIdConnectUrl) {
        Object.assign(baseObject, { openIdConnectUrl: securityScheme.openIdConnectUrl });
    }
    if (securityScheme.scheme) {
        Object.assign(baseObject, { scheme: securityScheme.scheme });
    }
    if (securityScheme.bearerFormat) {
        Object.assign(baseObject, { bearerFormat: securityScheme.bearerFormat });
    }
    return baseObject;
}
exports.transformToSingleSecurity = transformToSingleSecurity;
function transformFlows(flows) {
    const transformedFlows = {};
    if (flows.password) {
        Object.assign(transformedFlows, {
            password: lodash_1.pickBy({
                refreshUrl: flows.password.refreshUrl,
                scopes: flows.password.scopes || {},
                tokenUrl: flows.password.tokenUrl || '',
            }),
        });
    }
    if (flows.implicit) {
        Object.assign(transformedFlows, {
            implicit: lodash_1.pickBy({
                authorizationUrl: flows.implicit.authorizationUrl || '',
                refreshUrl: flows.implicit.refreshUrl,
                scopes: flows.implicit.scopes || {},
            }),
        });
    }
    if (flows.authorizationCode) {
        Object.assign(transformedFlows, {
            authorizationCode: lodash_1.pickBy({
                authorizationUrl: flows.authorizationCode.authorizationUrl || '',
                refreshUrl: flows.authorizationCode.refreshUrl,
                scopes: flows.authorizationCode.scopes || {},
                tokenUrl: flows.authorizationCode.tokenUrl || '',
            }),
        });
    }
    if (flows.clientCredentials) {
        Object.assign(transformedFlows, {
            clientCredentials: lodash_1.pickBy({
                tokenUrl: flows.clientCredentials.tokenUrl || '',
                refreshUrl: flows.clientCredentials.refreshUrl,
                scopes: flows.clientCredentials.scopes || {},
            }),
        });
    }
    return transformedFlows;
}
//# sourceMappingURL=securities.js.map