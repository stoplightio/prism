"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpBasic = void 0;
const Either_1 = require("fp-ts/Either");
const lodash_1 = require("lodash");
const utils_1 = require("./utils");
const basicWWWAuthenticate = 'Basic realm="*"';
function checkHeader(authorizationHeader) {
    const [authScheme, token] = authorizationHeader.split(' ');
    const isBasicTokenGiven = !!(token && isBasicToken(token));
    const isBasicScheme = utils_1.isScheme('basic', authScheme);
    return utils_1.genRespForScheme(isBasicScheme, isBasicTokenGiven, basicWWWAuthenticate);
}
function isBasicToken(token) {
    const tokenParts = Buffer.from(token, 'base64').toString().split(':');
    return tokenParts.length === 2;
}
const httpBasic = (input) => {
    const authorizationHeader = lodash_1.get(input, ['headers', 'authorization'], '');
    return authorizationHeader ? checkHeader(authorizationHeader) : Either_1.left(utils_1.genUnauthorisedErr(basicWWWAuthenticate));
};
exports.httpBasic = httpBasic;
