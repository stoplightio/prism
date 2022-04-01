"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findSecurityHandler = void 0;
const apiKey_1 = require("./apiKey");
const basicAuth_1 = require("./basicAuth");
const digestAuth_1 = require("./digestAuth");
const bearer_1 = require("./bearer");
const types_1 = require("@stoplight/types");
const Either_1 = require("fp-ts/Either");
const securitySchemeHandlers = {
    openIdConnect: bearer_1.openIdConnect,
    oauth2: bearer_1.oauth2,
    apiKey: {
        cookie: apiKey_1.apiKeyInCookie,
        header: apiKey_1.apiKeyInHeader,
        query: apiKey_1.apiKeyInQuery,
    },
    http: {
        digest: digestAuth_1.httpDigest,
        basic: basicAuth_1.httpBasic,
        bearer: bearer_1.bearer,
    },
};
function createDiagnosticFor(scheme) {
    return {
        message: `We currently do not support this type of security scheme: ${scheme}`,
        severity: types_1.DiagnosticSeverity.Warning,
    };
}
function findSecurityHandler(scheme) {
    if (scheme.type === 'http') {
        return Either_1.fromNullable(createDiagnosticFor(`http/${scheme.scheme}`))(securitySchemeHandlers[scheme.type][scheme.scheme]);
    }
    if (scheme.type === 'apiKey') {
        return Either_1.fromNullable(createDiagnosticFor(`${scheme.type}/${scheme.in}`))(securitySchemeHandlers[scheme.type][scheme.in]);
    }
    return Either_1.fromNullable(createDiagnosticFor(scheme.type))(securitySchemeHandlers[scheme.type]);
}
exports.findSecurityHandler = findSecurityHandler;
