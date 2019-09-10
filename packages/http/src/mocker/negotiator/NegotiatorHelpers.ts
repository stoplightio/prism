import { chain as echain, Either, fromOption as EitherFromOption, left, map, right } from 'fp-ts/lib/Either';
import { alt, map as omap, Option } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { chain, Reader } from 'fp-ts/lib/Reader';
import {
  chain as rechain,
  fromOption as ReaderEitherfromOption,
  mapLeft,
  orElse,
  ReaderEither,
} from 'fp-ts/lib/ReaderEither';
import { Logger } from 'pino';

import { ProblemJsonError } from '@stoplight/prism-core';
import { IHttpOperation, IHttpOperationResponse, IMediaTypeContent } from '@stoplight/types';
import withLogger from '../../withLogger';
import { NOT_ACCEPTABLE, NOT_FOUND } from '../errors';
import {
  contentHasExamples,
  createResponseFromDefault,
  findBestExample,
  findBestHttpContentByMediaType,
  findDefaultContentType,
  findExampleByKey,
  findLowest2xx,
  findResponseByStatusCode,
  hasContents,
} from './InternalHelpers';
import { IHttpNegotiationResult, NegotiatePartialOptions, NegotiationOptions } from './types';

const helpers = {
  negotiateByPartialOptionsAndHttpContent(
    { code, exampleKey, dynamic }: NegotiatePartialOptions,
    httpContent: IMediaTypeContent,
  ): Either<Error, Omit<IHttpNegotiationResult, 'headers'>> {
    const { mediaType } = httpContent;

    if (exampleKey) {
      // the user provided exampleKey - highest priority
      const example = findExampleByKey(httpContent, exampleKey);
      if (example) {
        // example exists, return
        return right({
          code,
          mediaType,
          bodyExample: example,
        });
      } else {
        return left(
          ProblemJsonError.fromTemplate(
            NOT_FOUND,
            `Response for contentType: ${mediaType} and exampleKey: ${exampleKey} does not exist.`,
          ),
        );
      }
    } else if (dynamic === true) {
      if (httpContent.schema) {
        return right({
          code,
          mediaType,
          schema: httpContent.schema,
        });
      } else {
        return left(new Error(`Tried to force a dynamic response for: ${mediaType} but schema is not defined.`));
      }
    } else {
      // try to find a static example first
      const example = findBestExample(httpContent);
      if (example) {
        // if example exists, return
        return right({
          code,
          mediaType,
          bodyExample: example,
        });
      } else if (httpContent.schema) {
        return right({
          code,
          mediaType,
          schema: httpContent.schema,
        });
      } else {
        return right({
          code,
          mediaType,
        });
      }
    }
  },

  negotiateDefaultMediaType(
    partialOptions: NegotiatePartialOptions,
    response: IHttpOperationResponse,
  ): Either<Error, IHttpNegotiationResult> {
    const { code, dynamic, exampleKey } = partialOptions;
    const httpContent =
      hasContents(response) &&
      (findDefaultContentType(response) || findBestHttpContentByMediaType(response, ['application/json']));

    if (httpContent) {
      // a httpContent for default mediaType exists
      return pipe(
        helpers.negotiateByPartialOptionsAndHttpContent(
          {
            code,
            dynamic,
            exampleKey,
          },
          httpContent,
        ),
        map(contentNegotiationResult => ({
          headers: response.headers || [],
          ...contentNegotiationResult,
        })),
      );
    } else {
      // no httpContent found, returning empty body
      return right({
        code,
        mediaType: 'text/plain',
        bodyExample: {
          value: undefined,
          key: 'default',
        },
        headers: response.headers || [],
      });
    }
  },

  negotiateOptionsBySpecificResponse(
    _httpOperation: IHttpOperation,
    desiredOptions: NegotiationOptions,
    response: IHttpOperationResponse,
  ): ReaderEither<Logger, Error, IHttpNegotiationResult> {
    const { code, headers } = response;
    const { mediaTypes, dynamic, exampleKey } = desiredOptions;

    return withLogger(logger => {
      if (mediaTypes) {
        // a user provided mediaType
        const httpContent = hasContents(response) && findBestHttpContentByMediaType(response, mediaTypes);
        if (httpContent) {
          logger.success(`Found a compatible content for ${mediaTypes}`);
          // a httpContent for a provided mediaType exists
          return pipe(
            helpers.negotiateByPartialOptionsAndHttpContent(
              {
                code,
                dynamic,
                exampleKey,
              },
              httpContent,
            ),
            map(contentNegotiationResult => ({
              headers: headers || [],
              ...contentNegotiationResult,
              mediaType:
                contentNegotiationResult.mediaType === '*/*' ? 'text/plain' : contentNegotiationResult.mediaType,
            })),
          );
        } else {
          logger.warn(`Unable to find a content for ${mediaTypes}`);
          return left(ProblemJsonError.fromTemplate(NOT_ACCEPTABLE, `Unable to find content for ${mediaTypes}`));
        }
      }
      // user did not provide mediaType
      // OR
      // a httpContent for a provided mediaType does not exist
      logger.trace('No mediaType provided. Fallbacking to the default media type (application/json)');
      return helpers.negotiateDefaultMediaType(
        {
          code,
          dynamic,
          exampleKey,
        },
        response,
      );
    });
  },

  negotiateOptionsForDefaultCode(
    httpOperation: IHttpOperation,
    desiredOptions: NegotiationOptions,
  ): ReaderEither<Logger, Error, IHttpNegotiationResult> {
    return pipe(
      findLowest2xx(httpOperation.responses),
      ReaderEitherfromOption(() => new Error('No 2** response defined, cannot mock')),
      rechain(lowest2xxResponse =>
        helpers.negotiateOptionsBySpecificResponse(httpOperation, desiredOptions, lowest2xxResponse),
      ),
    );
  },

  negotiateOptionsBySpecificCode(
    httpOperation: IHttpOperation,
    desiredOptions: NegotiationOptions,
    code: string,
  ): ReaderEither<Logger, Error, IHttpNegotiationResult> {
    // find response by provided status code
    return pipe(
      withLogger(logger => {
        const result = findResponseByStatusCode(httpOperation.responses, code);
        if (!result) {
          logger.info(`Unable to find a ${code} response definition`);
          return createResponseFromDefault(httpOperation.responses, code);
        }

        return result;
      }),
      chain(responseByForcedStatusCode =>
        pipe(
          responseByForcedStatusCode,
          ReaderEitherfromOption(() =>
            ProblemJsonError.fromTemplate(NOT_FOUND, `Requested status code ${code} is not defined in the document.`),
          ),
          rechain(response =>
            pipe(
              helpers.negotiateOptionsBySpecificResponse(httpOperation, desiredOptions, response),
              orElse(() =>
                pipe(
                  helpers.negotiateOptionsForDefaultCode(httpOperation, desiredOptions),
                  mapLeft(error => new Error(`${error}. We tried default response, but we got ${error}`)),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  },

  negotiateOptionsForValidRequest(
    httpOperation: IHttpOperation,
    desiredOptions: NegotiationOptions,
  ): ReaderEither<Logger, Error, IHttpNegotiationResult> {
    const { code } = desiredOptions;
    if (code) {
      return helpers.negotiateOptionsBySpecificCode(httpOperation, desiredOptions, code);
    }
    return helpers.negotiateOptionsForDefaultCode(httpOperation, desiredOptions);
  },

  findResponse(httpResponses: IHttpOperationResponse[]): Reader<Logger, Option<IHttpOperationResponse>> {
    return withLogger<Option<IHttpOperationResponse>>(logger =>
      pipe(
        findResponseByStatusCode(httpResponses, '422'),
        alt(() => {
          logger.trace('Unable to find a 422 response definition');
          return findResponseByStatusCode(httpResponses, '400');
        }),
        alt(() => {
          logger.trace('Unable to find a 400 response definition.');
          return findResponseByStatusCode(httpResponses, '401');
        }),
        alt(() => findResponseByStatusCode(httpResponses, '403')),
        alt(() =>
          pipe(
            createResponseFromDefault(httpResponses, '422'),
            omap(response => {
              logger.success(`Created a ${response.code} from a default response`);
              return response;
            }),
          ),
        ),
        omap(response => {
          logger.success(`Found response ${response.code}. I'll try with it.`);
          return response;
        }),
      ),
    );
  },

  negotiateOptionsForInvalidRequest(
    httpResponses: IHttpOperationResponse[],
  ): ReaderEither<Logger, Error, IHttpNegotiationResult> {
    return pipe(
      helpers.findResponse(httpResponses),
      chain(response =>
        withLogger(logger =>
          pipe(
            response,
            EitherFromOption(() => new Error('No 422, 400, or default responses defined')),
            echain(response => {
              // find first response with any static examples
              const contentWithExamples = response.contents && response.contents.find(contentHasExamples);

              if (contentWithExamples) {
                logger.success(`The response ${response.code} has an example. I'll keep going with this one`);
                return right({
                  code: response.code,
                  mediaType: contentWithExamples.mediaType,
                  bodyExample: contentWithExamples.examples[0],
                  headers: response.headers || [],
                });
              } else {
                logger.trace(`Unable to find a content with an example defined for the response ${response.code}`);
                // find first response with a schema
                const responseWithSchema = response.contents && response.contents.find(content => !!content.schema);
                if (responseWithSchema) {
                  logger.success(`The response ${response.code} has a schema. I'll keep going with this one`);
                  return right({
                    code: response.code,
                    mediaType: responseWithSchema.mediaType,
                    schema: responseWithSchema.schema,
                    headers: response.headers || [],
                  });
                } else {
                  logger.trace(`Unable to find a content with a schema defined for the response ${response.code}`);
                  return left(new Error(`Neither schema nor example defined for ${response.code} response.`));
                }
              }
            }),
          ),
        ),
      ),
    );
  },
};

export default helpers;
