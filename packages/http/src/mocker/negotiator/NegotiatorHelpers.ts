import { IHttpOperation, IHttpOperationResponse, IMediaTypeContent, IHttpHeaderParam } from '@stoplight/types';
import * as E from 'fp-ts/Either';
import { NonEmptyArray, fromArray } from 'fp-ts/NonEmptyArray';
import { findIndex } from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as R from 'fp-ts/Reader';
import * as RE from 'fp-ts/ReaderEither';
import { pipe } from 'fp-ts/pipeable';
import { tail } from 'lodash';
import { Logger } from 'pino';
import withLogger from '../../withLogger';
import { NOT_ACCEPTABLE, NOT_FOUND, NO_SUCCESS_RESPONSE_DEFINED } from '../errors';
import {
  contentHasExamples,
  createResponseFromDefault,
  findFirstExample,
  findBestHttpContentByMediaType,
  findDefaultContentType,
  findExampleByKey,
  findLowest2xx,
  findResponseByStatusCode,
} from './InternalHelpers';
import { IHttpNegotiationResult, NegotiatePartialOptions, NegotiationOptions } from './types';
import { JSONSchema, ProblemJsonError } from '../../types';

const outputNoContentFoundMessage = (contentTypes: string[]) => `Unable to find content for ${contentTypes}`;

const createEmptyResponse = (code: string, headers: IHttpHeaderParam[], mediaTypes: string[]) =>
  pipe(
    mediaTypes,
    findIndex(ct => ct.includes('*/*')),
    O.map(() => ({ code, headers }))
  );

type BodyNegotiationResult = Omit<IHttpNegotiationResult, 'headers'>;

const helpers = {
  negotiateByPartialOptionsAndHttpContent(
    { code, exampleKey, dynamic }: NegotiatePartialOptions,
    httpContent: IMediaTypeContent
  ): E.Either<Error, BodyNegotiationResult> {
    const { mediaType } = httpContent;

    if (exampleKey) {
      return pipe(
        findExampleByKey(httpContent, exampleKey),
        E.fromOption(() =>
          ProblemJsonError.fromTemplate(
            NOT_FOUND,
            `Response for contentType: ${mediaType} and exampleKey: ${exampleKey} does not exist.`
          )
        ),
        E.map(bodyExample => ({ code, mediaType, bodyExample }))
      );
    } else if (dynamic === true) {
      return pipe(
        httpContent.schema,
        E.fromNullable(new Error(`Tried to force a dynamic response for: ${mediaType} but schema is not defined.`)),
        E.map(schema => ({ code, mediaType, schema }))
      );
    } else {
      // try to find a static example first

      return E.right(
        pipe(
          findFirstExample(httpContent),
          O.map(bodyExample => ({ code, mediaType, bodyExample })),
          O.alt(() =>
            pipe(
              O.fromNullable(httpContent.schema),
              O.map<JSONSchema, BodyNegotiationResult>(schema => ({ schema, code, mediaType }))
            )
          ),
          O.getOrElse<BodyNegotiationResult>(() => ({ code, mediaType }))
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
                () =>
                  pipe(
                    createEmptyResponse(response.code, headers, mediaTypes),
                    O.map(payloadlessResponse => {
                      logger.info(`${outputNoContentFoundMessage(mediaTypes)}. Sending an empty response.`);
                      return payloadlessResponse;
                    }),
                    E.fromOption<Error>(() => {
                      logger.warn(outputNoContentFoundMessage(mediaTypes));
                      return ProblemJsonError.fromTemplate(NOT_ACCEPTABLE, `Unable to find content for ${mediaTypes}`);
                    })
                  ),
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

  negotiateOptionsForDefaultCode(
    httpOperation: IHttpOperation,
    desiredOptions: NegotiationOptions
  ): RE.ReaderEither<Logger, Error, IHttpNegotiationResult> {
    return pipe(
      findLowest2xx(httpOperation.responses),
      RE.fromOption(() => ProblemJsonError.fromTemplate(NO_SUCCESS_RESPONSE_DEFINED)),
      RE.chain(lowest2xxResponse =>
        helpers.negotiateOptionsBySpecificResponse(httpOperation.method, desiredOptions, lowest2xxResponse)
      )
    );
  },

  negotiateOptionsBySpecificCode(
    httpOperation: IHttpOperation,
    desiredOptions: NegotiationOptions,
    code: string
  ): RE.ReaderEither<Logger, Error, IHttpNegotiationResult> {
    // find response by provided status code
    return pipe(
      withLogger(logger =>
        pipe(
          findResponseByStatusCode(httpOperation.responses, code),
          O.alt(() => {
            logger.info(`Unable to find a ${code} response definition`);
            return createResponseFromDefault(httpOperation.responses, code);
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
                  helpers.negotiateOptionsForDefaultCode(httpOperation, desiredOptions),
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
    return helpers.negotiateOptionsForDefaultCode(httpOperation, desiredOptions);
  },

  findResponse(
    httpResponses: IHttpOperationResponse[],
    statusCodes: NonEmptyArray<string>
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
            createResponseFromDefault(httpResponses, first),
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
    statusCodes: NonEmptyArray<string>
  ): RE.ReaderEither<Logger, Error, IHttpNegotiationResult> {
    return pipe(
      helpers.findResponse(httpResponses, statusCodes),
      R.chain(foundResponse => logger =>
        pipe(
          foundResponse,
          E.fromOption(() => new Error('No 422, 400, or default responses defined')),
          E.chain(response => {
            // find first response with any static examples
            const contentWithExamples = response.contents && response.contents.find(contentHasExamples);

            if (contentWithExamples) {
              logger.success(`The response ${response.code} has an example. I'll keep going with this one`);
              return E.right({
                code: response.code,
                mediaType: contentWithExamples.mediaType,
                bodyExample: contentWithExamples.examples[0],
                headers: response.headers || [],
              });
            } else {
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
            }
          })
        )
      )
    );
  },
};

export default helpers;
