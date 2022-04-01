"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const E = require("fp-ts/Either");
const NonEmptyArray_1 = require("fp-ts/NonEmptyArray");
const Array_1 = require("fp-ts/Array");
const O = require("fp-ts/Option");
const R = require("fp-ts/Reader");
const RE = require("fp-ts/ReaderEither");
const function_1 = require("fp-ts/function");
const lodash_1 = require("lodash");
const withLogger_1 = require("../../withLogger");
const errors_1 = require("../errors");
const InternalHelpers_1 = require("./InternalHelpers");
const types_1 = require("../../types");
const outputNoContentFoundMessage = (contentTypes) => `Unable to find content for ${contentTypes}`;
const createEmptyResponse = (code, headers, mediaTypes) => {
    return function_1.pipe(code, O.fromPredicate(code => code === '204'), O.map(() => ({ code, headers })), O.alt(() => function_1.pipe(mediaTypes, Array_1.findIndex(ct => ct.includes('*/*')), O.map(() => ({ code, headers })))));
};
const helpers = {
    negotiateByPartialOptionsAndHttpContent({ code, exampleKey, dynamic }, httpContent) {
        const { mediaType } = httpContent;
        if (exampleKey) {
            return function_1.pipe(InternalHelpers_1.findExampleByKey(httpContent, exampleKey), E.fromOption(() => types_1.ProblemJsonError.fromTemplate(errors_1.NOT_FOUND, `Response for contentType: ${mediaType} and exampleKey: ${exampleKey} does not exist.`)), E.map(bodyExample => ({ code, mediaType, bodyExample })));
        }
        else if (dynamic) {
            return function_1.pipe(httpContent.schema, E.fromNullable(new Error(`Tried to force a dynamic response for: ${mediaType} but schema is not defined.`)), E.map(schema => ({ code, mediaType, schema })));
        }
        else {
            return E.right(function_1.pipe(InternalHelpers_1.findFirstExample(httpContent), O.map(bodyExample => ({ code, mediaType, bodyExample })), O.alt(() => function_1.pipe(O.fromNullable(httpContent.schema), O.map(schema => ({ schema, code, mediaType })))), O.getOrElse(() => ({ code, mediaType }))));
        }
    },
    negotiateDefaultMediaType(partialOptions, response) {
        const { code, dynamic, exampleKey } = partialOptions;
        const { headers = [] } = response;
        const findHttpContent = function_1.pipe(O.fromNullable(response.contents), O.chain(contents => function_1.pipe(InternalHelpers_1.findDefaultContentType(contents), O.alt(() => InternalHelpers_1.findBestHttpContentByMediaType(contents, ['application/json', '*/*'])))));
        return function_1.pipe(findHttpContent, O.fold(() => E.right({
            code,
            mediaType: 'text/plain',
            bodyExample: {
                value: undefined,
                key: 'default',
            },
            headers,
        }), content => function_1.pipe(helpers.negotiateByPartialOptionsAndHttpContent({ code, dynamic, exampleKey }, content), E.map(contentNegotiationResult => ({ headers, ...contentNegotiationResult })))));
    },
    negotiateOptionsBySpecificResponse(requestMethod, desiredOptions, response) {
        const { code, headers = [] } = response;
        const { mediaTypes, dynamic, exampleKey } = desiredOptions;
        return logger => {
            if (requestMethod === 'head') {
                logger.info(`Responding with an empty body to a HEAD request.`);
                return E.right({ code: response.code, headers });
            }
            return function_1.pipe(O.fromNullable(mediaTypes), O.chain(NonEmptyArray_1.fromArray), O.fold(() => {
                logger.debug('No mediaType provided. Fallbacking to the default media type (application/json)');
                return helpers.negotiateDefaultMediaType({
                    code,
                    dynamic,
                    exampleKey,
                }, response);
            }, mediaTypes => function_1.pipe(O.fromNullable(response.contents), O.chain(contents => InternalHelpers_1.findBestHttpContentByMediaType(contents, mediaTypes)), O.fold(() => function_1.pipe(createEmptyResponse(response.code, headers, mediaTypes), O.map(payloadlessResponse => {
                logger.info(`${outputNoContentFoundMessage(mediaTypes)}. Sending an empty response.`);
                return payloadlessResponse;
            }), E.fromOption(() => {
                logger.warn(outputNoContentFoundMessage(mediaTypes));
                return types_1.ProblemJsonError.fromTemplate(errors_1.NOT_ACCEPTABLE, `Unable to find content for ${mediaTypes}`);
            })), content => {
                logger.success(`Found a compatible content for ${mediaTypes}`);
                return function_1.pipe(helpers.negotiateByPartialOptionsAndHttpContent({
                    code,
                    dynamic,
                    exampleKey,
                }, content), E.map(contentNegotiationResult => ({
                    headers,
                    ...contentNegotiationResult,
                    mediaType: contentNegotiationResult.mediaType === '*/*'
                        ? 'text/plain'
                        : contentNegotiationResult.mediaType,
                })));
            }))));
        };
    },
    negotiateOptionsForUnspecifiedCode(httpOperation, desiredOptions) {
        return function_1.pipe(InternalHelpers_1.findLowest2xx(httpOperation.responses), O.alt(() => InternalHelpers_1.findFirstResponse(httpOperation.responses)), RE.fromOption(() => types_1.ProblemJsonError.fromTemplate(errors_1.NO_RESPONSE_DEFINED)), RE.chain(response => helpers.negotiateOptionsBySpecificResponse(httpOperation.method, desiredOptions, response)));
    },
    negotiateOptionsBySpecificCode(httpOperation, desiredOptions, code) {
        return function_1.pipe(withLogger_1.default(logger => function_1.pipe(InternalHelpers_1.findResponseByStatusCode(httpOperation.responses, code), O.alt(() => {
            logger.info(`Unable to find a ${code} response definition`);
            return InternalHelpers_1.createResponseFromDefault(httpOperation.responses, code);
        }))), R.chain(responseByForcedStatusCode => function_1.pipe(responseByForcedStatusCode, RE.fromOption(() => types_1.ProblemJsonError.fromTemplate(errors_1.NOT_FOUND, `Requested status code ${code} is not defined in the document.`)), RE.chain(response => function_1.pipe(helpers.negotiateOptionsBySpecificResponse(httpOperation.method, desiredOptions, response), RE.orElse(() => function_1.pipe(helpers.negotiateOptionsForUnspecifiedCode(httpOperation, desiredOptions), RE.mapLeft(error => new Error(`${error}. We tried default response, but we got ${error}`)))))))));
    },
    negotiateOptionsForValidRequest(httpOperation, desiredOptions) {
        const { code } = desiredOptions;
        if (code) {
            return helpers.negotiateOptionsBySpecificCode(httpOperation, desiredOptions, code);
        }
        return helpers.negotiateOptionsForUnspecifiedCode(httpOperation, desiredOptions);
    },
    findResponse(httpResponses, statusCodes) {
        const [first, ...others] = statusCodes;
        return logger => function_1.pipe(others.reduce((previous, current, index) => function_1.pipe(previous, O.alt(() => {
            logger.debug(`Unable to find a ${statusCodes[index]} response definition`);
            return InternalHelpers_1.findResponseByStatusCode(httpResponses, current);
        })), function_1.pipe(InternalHelpers_1.findResponseByStatusCode(httpResponses, first))), O.alt(() => {
            logger.debug(`Unable to find a ${lodash_1.tail(statusCodes)} response definition`);
            return function_1.pipe(InternalHelpers_1.createResponseFromDefault(httpResponses, first), O.fold(() => {
                logger.debug("Unable to find a 'default' response definition");
                return O.none;
            }, response => {
                logger.success(`Created a ${response.code} from a default response`);
                return O.some(response);
            }));
        }), O.map(response => {
            logger.success(`Found response ${response.code}. I'll try with it.`);
            return response;
        }));
    },
    negotiateOptionsForInvalidRequest(httpResponses, statusCodes, exampleKey) {
        const buildResponseBySchema = (response, logger) => {
            logger.debug(`Unable to find a content with an example defined for the response ${response.code}`);
            const responseWithSchema = response.contents && response.contents.find(content => !!content.schema);
            if (responseWithSchema) {
                logger.success(`The response ${response.code} has a schema. I'll keep going with this one`);
                return E.right({
                    code: response.code,
                    mediaType: responseWithSchema.mediaType,
                    schema: responseWithSchema.schema,
                    headers: response.headers || [],
                });
            }
            else {
                return function_1.pipe(createEmptyResponse(response.code, response.headers || [], ['*/*']), E.fromOption(() => {
                    logger.debug(`Unable to find a content with a schema defined for the response ${response.code}`);
                    return new Error(`Neither schema nor example defined for ${response.code} response.`);
                }));
            }
        };
        const buildResponseByExamples = (response, contentWithExamples, logger, exampleKey) => {
            logger.success(`The response ${response.code} has an example. I'll keep going with this one`);
            return function_1.pipe(O.fromNullable(exampleKey), O.fold(() => function_1.pipe(O.fromNullable(contentWithExamples.examples[0]), E.fromOption(() => types_1.ProblemJsonError.fromTemplate(errors_1.NOT_FOUND, `First example for contentType: ${contentWithExamples.mediaType} does not exist.`))), exampleKey => function_1.pipe(InternalHelpers_1.findExampleByKey(contentWithExamples, exampleKey), E.fromOption(() => types_1.ProblemJsonError.fromTemplate(errors_1.NOT_FOUND, `Response for contentType: ${contentWithExamples.mediaType} and exampleKey: ${exampleKey} does not exist.`)))), E.map(bodyExample => {
                return {
                    code: response.code,
                    mediaType: contentWithExamples.mediaType,
                    headers: response.headers || [],
                    bodyExample,
                };
            }));
        };
        return function_1.pipe(helpers.findResponse(httpResponses, statusCodes), R.chain(foundResponse => logger => function_1.pipe(foundResponse, E.fromOption(() => new Error('No 422, 400, or default responses defined')), E.chain(response => function_1.pipe(O.fromNullable(response.contents && response.contents.find(InternalHelpers_1.contentHasExamples)), O.fold(() => buildResponseBySchema(response, logger), contentWithExamples => buildResponseByExamples(response, contentWithExamples, logger, exampleKey)))))));
    },
};
exports.default = helpers;
