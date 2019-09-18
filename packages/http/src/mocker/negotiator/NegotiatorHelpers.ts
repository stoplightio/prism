import { ProblemJsonError } from '@stoplight/prism-core';
import { IHttpOperation, IHttpOperationResponse, IMediaTypeContent } from '@stoplight/types';
import * as Either from 'fp-ts/lib/Either';
import * as Option from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import * as Reader from 'fp-ts/lib/Reader';
import * as ReaderEither from 'fp-ts/lib/ReaderEither';
import { Logger } from 'pino';
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
  ): Either.Either<Error, Omit<IHttpNegotiationResult, 'headers'>> {
    const { mediaType } = httpContent;

    if (exampleKey) {
      // the user provided exampleKey - highest priority
      const example = findExampleByKey(httpContent, exampleKey);
      if (example) {
        // example exists, return
        return Either.right({
          code,
          mediaType,
          bodyExample: example,
        });
      } else {
        return Either.left(
          ProblemJsonError.fromTemplate(
            NOT_FOUND,
            `Response for contentType: ${mediaType} and exampleKey: ${exampleKey} does not exist.`,
          ),
        );
      }
    } else if (dynamic === true) {
      if (httpContent.schema) {
        return Either.right({
          code,
          mediaType,
          schema: httpContent.schema,
        });
      } else {
        return Either.left(new Error(`Tried to force a dynamic response for: ${mediaType} but schema is not defined.`));
      }
    } else {
      // try to find a static example first
      const example = findBestExample(httpContent);
      if (example) {
        // if example exists, return
        return Either.right({
          code,
          mediaType,
          bodyExample: example,
        });
      } else if (httpContent.schema) {
        return Either.right({
          code,
          mediaType,
          schema: httpContent.schema,
        });
      } else {
        return Either.right({
          code,
          mediaType,
        });
      }
    }
  },

  negotiateDefaultMediaType(
    partialOptions: NegotiatePartialOptions,
    response: IHttpOperationResponse,
  ): Either.Either<Error, IHttpNegotiationResult> {
    const { code, dynamic, exampleKey } = partialOptions;
    const httpContent = hasContents(response)
      ? pipe(
          findDefaultContentType(response),
          Option.alt(() => findBestHttpContentByMediaType(response, ['application/json'])),
        )
      : Option.none;

    return pipe(
      httpContent,
      Option.fold(
        () =>
          Either.right<Error, IHttpNegotiationResult>({
            code,
            mediaType: 'text/plain',
            bodyExample: {
              value: undefined,
              key: 'default',
            },
            headers: response.headers || [],
          }),
        content =>
          pipe(
            helpers.negotiateByPartialOptionsAndHttpContent(
              {
                code,
                dynamic,
                exampleKey,
              },
              content,
            ),
            Either.map(contentNegotiationResult => ({
              headers: response.headers || [],
              ...contentNegotiationResult,
            })),
          ),
      ),
    );
  },

  negotiateOptionsBySpecificResponse(
    _httpOperation: IHttpOperation,
    desiredOptions: NegotiationOptions,
    response: IHttpOperationResponse,
  ): ReaderEither.ReaderEither<Logger, Error, IHttpNegotiationResult> {
    const { code, headers } = response;
    const { mediaTypes, dynamic, exampleKey } = desiredOptions;

    return withLogger(logger => {
      if (_httpOperation.method === 'head') {
        logger.info(`Responding with an empty body to a HEAD request.`);

        return Either.right({
          code: response.code,
          headers: response.headers || [],
        });
      }

      if (mediaTypes) {
        // a user provided mediaType
        const httpContent = hasContents(response) ? findBestHttpContentByMediaType(response, mediaTypes) : Option.none;

        return pipe(
          httpContent,
          Option.fold(
            () => {
              logger.warn(`Unable to find a content for ${mediaTypes}`);
              return Either.left<Error, IHttpNegotiationResult>(
                ProblemJsonError.fromTemplate(NOT_ACCEPTABLE, `Unable to find content for ${mediaTypes}`),
              );
            },
            content => {
              logger.success(`Found a compatible content for ${mediaTypes}`);
              // a httpContent for a provided mediaType exists
              return pipe(
                helpers.negotiateByPartialOptionsAndHttpContent(
                  {
                    code,
                    dynamic,
                    exampleKey,
                  },
                  content,
                ),
                Either.map(contentNegotiationResult => ({
                  headers: headers || [],
                  ...contentNegotiationResult,
                  mediaType:
                    contentNegotiationResult.mediaType === '*/*' ? 'text/plain' : contentNegotiationResult.mediaType,
                })),
              );
            },
          ),
        );
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
  ): ReaderEither.ReaderEither<Logger, Error, IHttpNegotiationResult> {
    return pipe(
      findLowest2xx(httpOperation.responses),
      ReaderEither.fromOption(() => new Error('No 2** response defined, cannot mock')),
      ReaderEither.chain(lowest2xxResponse =>
        helpers.negotiateOptionsBySpecificResponse(httpOperation, desiredOptions, lowest2xxResponse),
      ),
    );
  },

  negotiateOptionsBySpecificCode(
    httpOperation: IHttpOperation,
    desiredOptions: NegotiationOptions,
    code: string,
  ): ReaderEither.ReaderEither<Logger, Error, IHttpNegotiationResult> {
    // find response by provided status code
    return pipe(
      withLogger(logger => {
        return pipe(
          findResponseByStatusCode(httpOperation.responses, code),
          Option.alt(() => {
            logger.info(`Unable to find a ${code} response definition`);
            return createResponseFromDefault(httpOperation.responses, code);
          }),
        );
      }),
      Reader.chain(responseByForcedStatusCode =>
        pipe(
          responseByForcedStatusCode,
          ReaderEither.fromOption(() =>
            ProblemJsonError.fromTemplate(NOT_FOUND, `Requested status code ${code} is not defined in the document.`),
          ),
          ReaderEither.chain(response =>
            pipe(
              helpers.negotiateOptionsBySpecificResponse(httpOperation, desiredOptions, response),
              ReaderEither.orElse(() =>
                pipe(
                  helpers.negotiateOptionsForDefaultCode(httpOperation, desiredOptions),
                  ReaderEither.mapLeft(error => new Error(`${error}. We tried default response, but we got ${error}`)),
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
  ): ReaderEither.ReaderEither<Logger, Error, IHttpNegotiationResult> {
    const { code } = desiredOptions;
    if (code) {
      return helpers.negotiateOptionsBySpecificCode(httpOperation, desiredOptions, code);
    }
    return helpers.negotiateOptionsForDefaultCode(httpOperation, desiredOptions);
  },

  findResponse(httpResponses: IHttpOperationResponse[]): Reader.Reader<Logger, Option.Option<IHttpOperationResponse>> {
    return withLogger<Option.Option<IHttpOperationResponse>>(logger =>
      pipe(
        findResponseByStatusCode(httpResponses, '422'),
        Option.alt(() => {
          logger.trace('Unable to find a 422 response definition');
          return findResponseByStatusCode(httpResponses, '400');
        }),
        Option.alt(() => {
          logger.trace('Unable to find a 400 response definition.');
          return findResponseByStatusCode(httpResponses, '401');
        }),
        Option.alt(() => findResponseByStatusCode(httpResponses, '403')),
        Option.alt(() =>
          pipe(
            createResponseFromDefault(httpResponses, '422'),
            Option.map(response => {
              logger.success(`Created a ${response.code} from a default response`);
              return response;
            }),
          ),
        ),
        Option.map(response => {
          logger.success(`Found response ${response.code}. I'll try with it.`);
          return response;
        }),
      ),
    );
  },

  negotiateOptionsForInvalidRequest(
    httpResponses: IHttpOperationResponse[],
  ): ReaderEither.ReaderEither<Logger, Error, IHttpNegotiationResult> {
    return pipe(
      helpers.findResponse(httpResponses),
      Reader.chain(foundResponse =>
        withLogger(logger =>
          pipe(
            foundResponse,
            Either.fromOption(() => new Error('No 422, 400, or default responses defined')),
            Either.chain(response => {
              // find first response with any static examples
              const contentWithExamples = response.contents && response.contents.find(contentHasExamples);

              if (contentWithExamples) {
                logger.success(`The response ${response.code} has an example. I'll keep going with this one`);
                return Either.right({
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
                  return Either.right({
                    code: response.code,
                    mediaType: responseWithSchema.mediaType,
                    schema: responseWithSchema.schema,
                    headers: response.headers || [],
                  });
                } else {
                  logger.trace(`Unable to find a content with a schema defined for the response ${response.code}`);
                  return Either.left(new Error(`Neither schema nor example defined for ${response.code} response.`));
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
