"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
function translateToFlows(security) {
    const tokenAndScope = {
        tokenUrl: security.tokenUrl,
        scopes: security.scopes || {},
    };
    const flowsDict = {
        implicit: ['implicit', { scopes: tokenAndScope.scopes, authorizationUrl: security.authorizationUrl }],
        password: ['password', tokenAndScope],
        application: ['clientCredentials', tokenAndScope],
        accessCode: ['authorizationCode', Object.assign({}, tokenAndScope, { authorizationUrl: security.authorizationUrl })],
    };
    const flow = flowsDict[security.flow];
    return flow ? { [flow[0]]: flow[1] } : {};
}
function translateToBasicSecurityScheme(security) {
    return {
        type: 'http',
        scheme: 'basic',
        description: security.description,
    };
}
function translateToApiKeySecurityScheme(security) {
    const acceptableSecurityOrigins = ['query', 'header', 'cookie'];
    if (!security.in || !acceptableSecurityOrigins.includes(security.in)) {
        throw new Error(`Provided security origin (the 'in' property): '${security.in}' is not valid. Should be one of the following: ${acceptableSecurityOrigins}`);
    }
    return {
        type: 'apiKey',
        name: security.name || 'no name',
        in: security.in,
        description: security.description,
    };
}
function translateToOauth2SecurityScheme(security) {
    return {
        type: 'oauth2',
        flows: translateToFlows(security),
        description: security.description,
    };
}
function translateToSingleSecurity(security) {
    switch (security.type) {
        case 'basic':
            return translateToBasicSecurityScheme(security);
        case 'apiKey':
            return translateToApiKeySecurityScheme(security);
        case 'oauth2':
            return translateToOauth2SecurityScheme(security);
    }
    return;
}
exports.translateToSingleSecurity = translateToSingleSecurity;
function translateToSecurities(securities) {
    return lodash_1.compact(securities.map(translateToSingleSecurity));
}
exports.translateToSecurities = translateToSecurities;
//# sourceMappingURL=securities.js.map