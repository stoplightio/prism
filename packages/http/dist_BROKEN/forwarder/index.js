"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = require("node-fetch");
const function_1 = require("fp-ts/function");
const NEA = require("fp-ts/NonEmptyArray");
const E = require("fp-ts/Either");
const TE = require("fp-ts/TaskEither");
const J = require("fp-ts/Json");
const lodash_1 = require("lodash");
const url_1 = require("url");
const path_1 = require("path");
const parseResponse_1 = require("../utils/parseResponse");
const resources_1 = require("./resources");
const mocker_1 = require("../mocker");
const types_1 = require("../types");
const errors_1 = require("./errors");
const { version: prismVersion } = require('../../package.json');
const forward = ({ data: input, validations }, baseUrl, resource) => logger => function_1.pipe(NEA.fromArray(validations), TE.fromOption(() => undefined), TE.map(failedValidations => {
    const securityValidation = failedValidations.find(validation => validation.code === 401);
    return securityValidation
        ? mocker_1.createUnauthorisedResponse(securityValidation.tags)
        : mocker_1.createUnprocessableEntityResponse(failedValidations);
}), TE.swap, TE.chainEitherK(() => serializeBody(input.body)), TE.chain(body => TE.tryCatch(async () => {
    const partialUrl = url_1.parse(baseUrl);
    const url = url_1.format({
        ...partialUrl,
        pathname: path_1.posix.join(partialUrl.pathname || '', input.url.path),
        query: input.url.query,
    });
    logger.info(`Forwarding "${input.method}" request to ${url}...`);
    return node_fetch_1.default(url, {
        body,
        method: input.method,
        headers: lodash_1.defaults(lodash_1.omit(input.headers, ['host']), {
            'accept-encoding': '*',
            accept: 'application/json, text/plain, */*',
            'user-agent': `Prism/${prismVersion}`,
        }),
    });
}, E.toError)), TE.chainFirst(response => {
    if (response.status === 501) {
        logger.warn(`Upstream call to ${input.url.path} has returned 501`);
        return TE.left(types_1.ProblemJsonError.fromTemplate(errors_1.UPSTREAM_NOT_IMPLEMENTED));
    }
    logger.info(`The upstream call to ${input.url.path} has returned ${response.status}`);
    return TE.right(undefined);
}), TE.chain(parseResponse_1.parseResponse), TE.map(response => {
    if (resource && resource.deprecated && response.headers && !response.headers.deprecation) {
        response.headers.deprecation = 'true';
    }
    return response;
}), TE.map(stripHopByHopHeaders));
exports.default = forward;
function serializeBody(body) {
    if (typeof body === 'string') {
        return E.right(body);
    }
    if (body)
        return function_1.pipe(J.stringify(body), E.mapLeft(E.toError));
    return E.right(undefined);
}
const stripHopByHopHeaders = (response) => {
    response.headers = lodash_1.omit(response.headers, resources_1.hopByHopHeaders);
    return response;
};
