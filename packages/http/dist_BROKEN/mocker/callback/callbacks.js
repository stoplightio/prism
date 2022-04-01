"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCallback = void 0;
const runtimeExpression_1 = require("../../utils/runtimeExpression");
const node_fetch_1 = require("node-fetch");
const E = require("fp-ts/Either");
const O = require("fp-ts/Option");
const A = require("fp-ts/Array");
const TE = require("fp-ts/TaskEither");
const J = require("fp-ts/Json");
const Array_1 = require("fp-ts/Array");
const function_1 = require("fp-ts/function");
const HttpParamGenerator_1 = require("../generator/HttpParamGenerator");
const validator_1 = require("../../validator");
const parseResponse_1 = require("../../utils/parseResponse");
const logger_1 = require("../../utils/logger");
function runCallback({ callback, request, response, }) {
    return logger => {
        const { url, requestData } = assembleRequest({ resource: callback, request, response });
        const logViolation = logger_1.violationLogger(logger);
        logger.info({ name: 'CALLBACK' }, `${callback.callbackName}: Making request to ${url}...`);
        return function_1.pipe(TE.tryCatch(() => node_fetch_1.default(url, requestData), E.toError), TE.chain(parseResponse_1.parseResponse), TE.mapLeft(error => logger.error({ name: 'CALLBACK' }, `${callback.callbackName}: Request failed: ${error.message}`)), TE.chainEitherK(element => {
            logger.info({ name: 'CALLBACK' }, `${callback.callbackName}: Request finished`);
            return function_1.pipe(validator_1.validateOutput({ resource: callback, element }), E.mapLeft(violations => {
                function_1.pipe(violations, A.map(logViolation));
            }));
        }));
    };
}
exports.runCallback = runCallback;
function assembleRequest({ resource, request, response, }) {
    const bodyAndMediaType = O.toUndefined(assembleBody(resource.request));
    return {
        url: runtimeExpression_1.resolveRuntimeExpressions(resource.path, request, response),
        requestData: {
            headers: O.toUndefined(assembleHeaders(resource.request, bodyAndMediaType === null || bodyAndMediaType === void 0 ? void 0 : bodyAndMediaType.mediaType)),
            body: bodyAndMediaType === null || bodyAndMediaType === void 0 ? void 0 : bodyAndMediaType.body,
            method: resource.method,
        },
    };
}
function assembleBody(request) {
    var _a;
    return function_1.pipe(O.fromNullable((_a = request === null || request === void 0 ? void 0 : request.body) === null || _a === void 0 ? void 0 : _a.contents), O.bind('content', contents => Array_1.head(contents)), O.bind('body', ({ content }) => HttpParamGenerator_1.generate(content)), O.chain(({ body, content: { mediaType } }) => function_1.pipe(J.stringify(body), E.map(body => ({ body, mediaType })), O.fromEither)));
}
const assembleHeaders = (request, bodyMediaType) => function_1.pipe(O.fromNullable(request === null || request === void 0 ? void 0 : request.headers), O.chain(O.traverseArray(param => function_1.pipe(HttpParamGenerator_1.generate(param), O.map(value => [param.name, value])))), O.reduce(function_1.pipe(O.fromNullable(bodyMediaType), O.map(mediaType => ({ 'content-type': mediaType }))), (mediaTypeHeader, headers) => ({ ...headers, ...mediaTypeHeader })));
