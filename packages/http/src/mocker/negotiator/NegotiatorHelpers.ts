import { IHttpOperation, IHttpOperationResponse, IMediaTypeContent, IHttpHeaderParam } from '@stoplight/types';
import * as E from 'fp-ts/Either';
import { NonEmptyArray, fromArray } from 'fp-ts/NonEmptyArray';
import { findIndex } from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as R from 'fp-ts/Reader';
import * as RE from 'fp-ts/ReaderEither';
import { pipe } from 'fp-ts/function';
import { tail } from 'lodash';
import { Logger } from 'pino';
import withLogger from '../../withLogger';
import { NOT_ACCEPTABLE, NOT_FOUND, NO_RESPONSE_DEFINED } from '../errors';
import {
  contentHasExamples,
  findDefaultResponse,
  findFirstExample,
  findBestHttpContentByMediaType,
  findDefaultContentType,
  findExampleByKey,
  findLowest2XXResponse,
  findResponseByStatusCode,
  findFirstResponse,
  IWithExampleMediaContent,
} from './InternalHelpers';
import { IHttpNegotiationResult, NegotiatePartialOptions, NegotiationOptions } from './types';
import { JSONSchema, ProblemJsonError } from '../../types';

const outputNoContentFoundMessage = (contentTypes: string[]) => `Unable to find content for ${contentTypes}`;

const createEmptyResponse = (code: string, headers: IHttpHeaderParam[], mediaTypes: string[]) => {
  return pipe(
    code,
    O.fromPredicate<string>(code => code === '204'),
    O.map(() => ({ code, headers })),
    O.alt(() =>
      pipe(
        mediaTypes,
        findIndex(ct => ct.includes('*/*')),
        O.map(() => ({ code, headers }))
      )
    )
  );
};

type BodyNegotiationResult = Omit<IHttpNegotiationResult, 'headers'>;

const helpers = {
  negotiateByPartialOptionsAndHttpContent(
    { code, exampleKey, dynamic }: NegotiatePartialOptions,
    httpContent: IMediaTypeContent
  ): E.Either<Error, BodyNegotiationResult> {
    const { mediaType, schema } = httpContent;
    if (exampleKey) {
      return pipe(
        findExampleByKey(httpContent, exampleKey),
        E.fromOption(() =>
          ProblemJsonError.fromTemplate(
            NOT_FOUND,
            `Response for contentType: ${mediaType} and exampleKey: ${exampleKey} does not exist.`
          )
        ),
        E.map(bodyExample => ({ code, mediaType, bodyExample, schema }))
      );
    } else if (dynamic) {
      return pipe(
        schema,
        E.fromNullable(new Error(`Tried to force a dynamic response for: ${mediaType} but schema is not defined.`)),
        E.map(schema => ({ code, mediaType, schema }))
      );
    } else {
      return E.right(
        pipe(
          findFirstExample(httpContent),
          O.map(bodyExample => ({ code, mediaType, bodyExample, schema })),
          O.alt(() =>
            pipe(
              O.fromNullable(schema),
              O.map<JSONSchema, BodyNegotiationResult>(schema => ({ schema, code, mediaType }))
            )
          ),
          O.getOrElse<BodyNegotiationResult>(() => ({ code, mediaType, schema }))
        )
      );
    }
  },

  negotiateDefaultMediaType(
    partialOptions: NegotiatePartialOptions,
    response: IHttpOperationResponse
  ): E.Either<Error, IHttpNegotiationResult> {
    const { code, dynamic, exampleKey } = partialOptions;
    const { headers = [] } = response;

    const findHttpContent = pipe(
      O.fromNullable(response.contents),
      O.chain(contents =>
        pipe(
          findDefaultContentType(contents),
          O.alt(() => findBestHttpContentByMediaType(contents, ['application/json', '*/*']))
        )
      )
    );

    return pipe(
      findHttpContent,
      O.fold(
        () =>
          E.right<Error, IHttpNegotiationResult>({
            code,
            mediaType: 'text/plain',
            bodyExample: {
              id: 'example',
              value: undefined,
              key: 'default',
            },
            headers,
          }),
        content =>
          pipe(
            helpers.negotiateByPartialOptionsAndHttpContent({ code, dynamic, exampleKey }, content),
            E.map(contentNegotiationResult => ({ headers, ...contentNegotiationResult }))
          )
      )
    );
  },

  negotiateOptionsBySpecificResponse(
    requestMethod: string,
    desiredOptions: NegotiationOptions,
    response: IHttpOperationResponse
  ): RE.ReaderEither<Logger, Error, IHttpNegotiationResult> {
    const { code, headers = [] } = response;
    const { mediaTypes, dynamic, exampleKey } = desiredOptions;

    return logger => {
      if (requestMethod === 'head') {
        logger.info(`Responding with an empty body to a HEAD request.`);
        return E.right({ code: response.code, headers });
      }

      return pipe(
        O.fromNullable(mediaTypes),
        O.chain(fromArray),
        O.fold(
          () => {
            logger.debug('No mediaType provided. Fallbacking to the default media type (application/json)');
            return helpers.negotiateDefaultMediaType(
              {
                code,
                dynamic,
                exampleKey,
              },
              response
            );
          },
          mediaTypes =>
            pipe(
              O.fromNullable(response.contents),
              O.chain(contents => findBestHttpContentByMediaType(contents, mediaTypes)),
              O.fold(
                () => {
                  logger.warn(outputNoContentFoundMessage(mediaTypes));

                  // the spec has a response body but does NOT have a media type defined for the one requested with the accept header (throw error)
                  if (response.contents?.length && response.contents?.length > 0) {
                    return pipe(
                      createEmptyResponse(response.code, headers, mediaTypes),
                        E.fromOption<Error>(() => {
                              return ProblemJsonError.fromTemplate(NOT_ACCEPTABLE, `Unable to find content for ${mediaTypes}`);
                        })
                  )}

                  // though accept header may have a request media type, the spec does not define a response body for the endpoint, so we essentially ignore the accept header (no error)
                  return E.right<Error, IHttpNegotiationResult>({
                    code: response.code,
                    headers: headers,
                  })
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
                      content
                    ),
                    E.map(contentNegotiationResult => ({
                      headers,
                      ...contentNegotiationResult,
                      mediaType:
                        contentNegotiationResult.mediaType === '*/*'
                          ? 'text/plain'
                          : contentNegotiationResult.mediaType,
                    }))
                  );
                }
              )
            )
        )
      );
    };
  },

  negotiateOptionsForUnspecifiedCode(
    httpOperation: IHttpOperation,
    desiredOptions: NegotiationOptions
  ): RE.ReaderEither<Logger, Error, IHttpNegotiationResult> {
    return pipe(
      findLowest2XXResponse(httpOperation.responses),
      O.alt(() => findDefaultResponse(httpOperation.responses)),
      O.alt(() => findFirstResponse(httpOperation.responses)),
      RE.fromOption(() => ProblemJsonError.fromTemplate(NO_RESPONSE_DEFINED)),
      RE.chain(response => helpers.negotiateOptionsBySpecificResponse(httpOperation.method, desiredOptions, response))
    );
  },

  negotiateOptionsBySpecificCode(
    httpOperation: IHttpOperation,
    desiredOptions: NegotiationOptions,
    code: number
  ): RE.ReaderEither<Logger, Error, IHttpNegotiationResult> {
    // find response by provided status code
    return pipe(
      withLogger(logger =>
        pipe(
          findResponseByStatusCode(httpOperation.responses, code),
          O.alt(() => {
            logger.info(`Unable to find a ${code} response definition`);
            return findDefaultResponse(httpOperation.responses, code);
          })
        )
      ),
      R.chain(responseByForcedStatusCode =>
        pipe(
          responseByForcedStatusCode,
          RE.fromOption(() =>
            ProblemJsonError.fromTemplate(NOT_FOUND, `Requested status code ${code} is not defined in the document.`)
          ),
          RE.chain(response =>
            pipe(
              helpers.negotiateOptionsBySpecificResponse(httpOperation.method, desiredOptions, response),
              RE.orElse(() =>
                pipe(
                  helpers.negotiateOptionsForUnspecifiedCode(httpOperation, desiredOptions),
                  RE.mapLeft(error => new Error(`${error}. We tried default response, but we got ${error}`))
                )
              )
            )
          )
        )
      )
    );
  },

  negotiateOptionsForValidRequest(
    httpOperation: IHttpOperation,
    desiredOptions: NegotiationOptions
  ): RE.ReaderEither<Logger, Error, IHttpNegotiationResult> {
    const { code } = desiredOptions;
    if (code) {
      return helpers.negotiateOptionsBySpecificCode(httpOperation, desiredOptions, code);
    }
    return helpers.negotiateOptionsForUnspecifiedCode(httpOperation, desiredOptions);
  },

  findResponse(
    httpResponses: IHttpOperationResponse[],
    statusCodes: NonEmptyArray<number>
  ): R.Reader<Logger, O.Option<IHttpOperationResponse>> {
    const [first, ...others] = statusCodes;

    return logger =>
      pipe(
        others.reduce(
          (previous, current, index) =>
            pipe(
              previous,
              O.alt(() => {
                logger.debug(`Unable to find a ${statusCodes[index]} response definition`);
                return findResponseByStatusCode(httpResponses, current);
              })
            ),
          pipe(findResponseByStatusCode(httpResponses, first))
        ),
        O.alt(() => {
          logger.debug(`Unable to find a ${tail(statusCodes)} response definition`);
          return pipe(
            findDefaultResponse(httpResponses, first),
            O.fold(
              () => {
                logger.debug("Unable to find a 'default' response definition");
                return O.none;
              },
              response => {
                logger.success(`Created a ${response.code} from a default response`);
                return O.some(response);
              }
            )
          );
        }),
        O.map(response => {
          logger.success(`Found response ${response.code}. I'll try with it.`);
          return response;
        })
      );
  },

  negotiateOptionsForInvalidRequest(
    httpResponses: IHttpOperationResponse[],
    statusCodes: NonEmptyArray<number>,
    exampleKey?: string
  ): RE.ReaderEither<Logger, Error, IHttpNegotiationResult> {
    const buildResponseBySchema = (response: IHttpOperationResponse, logger: Logger) => {
      logger.debug(`Unable to find a content with an example defined for the response ${response.code}`);
      // find first response with a schema
      const responseWithSchema = response.contents && response.contents.find(content => !!content.schema);
      if (responseWithSchema) {
        logger.success(`The response ${response.code} has a schema. I'll keep going with this one`);
        return E.right({
          code: response.code,
          mediaType: responseWithSchema.mediaType,
          schema: responseWithSchema.schema,
          headers: response.headers || [],
        });
      } else {
        return pipe(
          createEmptyResponse(response.code, response.headers || [], ['*/*']),
          E.fromOption(() => {
            logger.debug(`Unable to find a content with a schema defined for the response ${response.code}`);

            return new Error(`Neither schema nor example defined for ${response.code} response.`);
          })
        );
      }
    };

    /**
     * If exampleKey is provided - we try to find a matching example.
     * If exampleKey is not provided - the first example will be returned.
     */
    const buildResponseByExamples = (
      response: IHttpOperationResponse,
      contentWithExamples: IWithExampleMediaContent,
      logger: Logger,
      exampleKey?: string
    ) => {
      logger.success(`The response ${response.code} has an example. I'll keep going with this one`);
      return pipe(
        O.fromNullable(exampleKey),
        O.fold(
          () =>
            pipe(
              O.fromNullable(contentWithExamples.examples[0]), // if exampleKey is not specified use first example
              E.fromOption(() =>
                ProblemJsonError.fromTemplate(
                  NOT_FOUND,
                  `First example for contentType: ${contentWithExamples.mediaType} does not exist.`
                )
              )
            ),
          exampleKey =>
            pipe(
              findExampleByKey(contentWithExamples, exampleKey),
              E.fromOption(() =>
                ProblemJsonError.fromTemplate(
                  NOT_FOUND,
                  `Response for contentType: ${contentWithExamples.mediaType} and exampleKey: ${exampleKey} does not exist.`
                )
              )
            )
        ),
        E.map(bodyExample => {
          return {
            code: response.code,
            mediaType: contentWithExamples.mediaType,
            headers: response.headers || [],
            bodyExample,
          };
        })
      );
    };

    return pipe(
      helpers.findResponse(httpResponses, statusCodes),
      R.chain(
        foundResponse => logger =>
          pipe(
            foundResponse,
            E.fromOption(() => new Error('No 422, 400, or default responses defined')),
            E.chain(response =>
              pipe(
                O.fromNullable(response.contents && response.contents.find(contentHasExamples)),
                O.fold(
                  () => buildResponseBySchema(response, logger),
                  contentWithExamples => buildResponseByExamples(response, contentWithExamples, logger, exampleKey)
                )
              )
            )
          )
      )
    );
  },
};

export default helpers;
