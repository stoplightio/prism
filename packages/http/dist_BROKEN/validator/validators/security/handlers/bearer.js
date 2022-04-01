"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openIdConnect = exports.oauth2 = exports.bearer = void 0;
const Option_1 = require("fp-ts/Option");
const function_1 = require("fp-ts/function");
const lodash_1 = require("lodash");
const utils_1 = require("./utils");
const bearerHandler = (msg, input) => utils_1.when(isBearerToken(input.headers || {}), msg);
function isBearerToken(inputHeaders) {
    return function_1.pipe(Option_1.fromNullable(lodash_1.get(inputHeaders, 'authorization')), Option_1.map(authorization => !!/^Bearer\s.+$/.exec(authorization)), Option_1.getOrElse(() => false));
}
exports.bearer = lodash_1.partial(bearerHandler, 'Bearer');
exports.oauth2 = lodash_1.partial(bearerHandler, 'OAuth2');
exports.openIdConnect = lodash_1.partial(bearerHandler, 'OpenID');
