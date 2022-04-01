"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOutput = exports.validateMediaType = exports.validateInput = exports.validateSecurity = void 0;
const types_1 = require("@stoplight/types");
const caseless = require("caseless");
const contentType = require("content-type");
const A = require("fp-ts/Array");
const O = require("fp-ts/Option");
const E = require("fp-ts/Either");
const combinators_1 = require("../combinators");
const type_is_1 = require("type-is");
const function_1 = require("fp-ts/function");
const lodash_1 = require("lodash");
const uri_template_lite_1 = require("uri-template-lite");
const spec_1 = require("./utils/spec");
const validators_1 = require("./validators");
const types_2 = require("./validators/types");
var security_1 = require("./validators/security");
Object.defineProperty(exports, "validateSecurity", { enumerable: true, get: function () { return security_1.validateSecurity; } });
const checkBodyIsProvided = (requestBody, body) => function_1.pipe(requestBody, E.fromPredicate(requestBody => !(!!requestBody.required && !body), () => [{ code: 'required', message: 'Body parameter is required', severity: types_1.DiagnosticSeverity.Error }]));
const validateInputIfBodySpecIsProvided = (body, mediaType, contents, bundle) => function_1.pipe(combinators_1.sequenceOption(O.fromNullable(body), O.fromNullable(contents)), O.fold(() => E.right(body), ([body, contents]) => validators_1.validateBody(body, contents, types_2.ValidationContext.Input, mediaType, bundle)));
const tryValidateInputBody = (requestBody, bundle, body, mediaType) => function_1.pipe(checkBodyIsProvided(requestBody, body), E.chain(() => validateInputIfBodySpecIsProvided(body, mediaType, requestBody.contents, bundle)));
const validateInput = ({ resource, element }) => {
    const mediaType = caseless(element.headers || {}).get('content-type');
    const { request } = resource;
    const { body } = element;
    const bundle = resource['__bundled__'];
    return function_1.pipe(E.fromNullable(undefined)(request), E.fold(e => E.right(e), request => combinators_1.sequenceValidation(request.body ? tryValidateInputBody(request.body, bundle, body, mediaType) : E.right(undefined), request.headers ? validators_1.validateHeaders(element.headers || {}, request.headers, bundle) : E.right(undefined), request.query ? validators_1.validateQuery(element.url.query || {}, request.query, bundle) : E.right(undefined), request.path
        ? validators_1.validatePath(getPathParams(element.url.path, resource.path), request.path, bundle)
        : E.right(undefined))), E.map(() => element));
};
exports.validateInput = validateInput;
const findResponseByStatus = (responses, statusCode) => function_1.pipe(spec_1.findOperationResponse(responses, statusCode), E.fromOption(() => ({
    message: `Unable to match the returned status code with those defined in the document: ${responses
        .map(response => response.code)
        .join(',')}`,
    severity: lodash_1.inRange(statusCode, 200, 300) ? types_1.DiagnosticSeverity.Error : types_1.DiagnosticSeverity.Warning,
})), E.mapLeft(error => [error]));
const validateMediaType = (contents, mediaType) => function_1.pipe(O.fromNullable(mediaType), O.map(contentType.parse), O.chain(parsedMediaType => function_1.pipe(contents, A.findFirst(c => {
    const parsedSelectedContentMediaType = contentType.parse(c.mediaType);
    return (!!type_is_1.is(parsedMediaType.type, [parsedSelectedContentMediaType.type]) &&
        lodash_1.isMatch(parsedMediaType.parameters, parsedSelectedContentMediaType.parameters));
}))), E.fromOption(() => ({
    message: `The received media type "${mediaType || ''}" does not match the one${contents.length > 1 ? 's' : ''} specified in the current response: ${contents.map(c => c.mediaType).join(', ')}`,
    severity: types_1.DiagnosticSeverity.Error,
})), E.mapLeft(e => [e]));
exports.validateMediaType = validateMediaType;
const validateOutput = ({ resource, element }) => {
    const mediaType = caseless(element.headers || {}).get('content-type');
    const bundle = resource['__bundled__'];
    return function_1.pipe(findResponseByStatus(resource.responses, element.statusCode), E.chain(response => combinators_1.sequenceValidation(function_1.pipe(O.fromNullable(response.contents), O.chain(contents => function_1.pipe(contents, O.fromPredicate(A.isNonEmpty))), O.fold(() => E.right(undefined), contents => exports.validateMediaType(contents, mediaType))), validators_1.validateBody(element.body, response.contents || [], types_2.ValidationContext.Output, mediaType, bundle), validators_1.validateHeaders(element.headers || {}, response.headers || [], bundle))), E.map(() => element));
};
exports.validateOutput = validateOutput;
function getPathParams(path, template) {
    return new uri_template_lite_1.URI.Template(template).match(path);
}
