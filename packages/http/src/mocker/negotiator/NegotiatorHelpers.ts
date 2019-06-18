import { Either, left, right } from 'fp-ts/lib/Either';
import { reader, Reader } from 'fp-ts/lib/Reader';
import { Logger } from 'pino';

import { PickRequired } from '@stoplight/prism-http';
import { ContentExample, NonEmptyArray } from '@stoplight/prism-http/src/types';
import { IHttpContent, IHttpOperation, IHttpOperationResponse, IMediaTypeContent } from '@stoplight/types';
// @ts-ignore
import * as accepts from 'accepts';
import withLogger from '../../withLogger';
import { IHttpNegotiationResult, NegotiatePartialOptions, NegotiationOptions } from './types';

type IWithExampleMediaContent = IMediaTypeContent & { examples: NonEmptyArray<ContentExample> };

function findBestExample(httpContent: IHttpContent) {
  return httpContent.examples && httpContent.examples[0];
}

function findExampleByKey(httpContent: IHttpContent, exampleKey: string) {
  return httpContent.examples && httpContent.examples.find(example => example.key === exampleKey);
}

function hasContents(v: IHttpOperationResponse): v is PickRequired<IHttpOperationResponse, 'contents'> {
  return !!v.contents;
}

function findBestHttpContentByMediaType(
  response: PickRequired<IHttpOperationResponse, 'contents'>,
  mediaType: string[],
): IMediaTypeContent | undefined {
  return response.contents.find(content =>
    accepts({
      headers: {
        accept: mediaType.join(','),
      },
    }).type(content.mediaType),
  );
}

function findDefaultContentType(
  response: PickRequired<IHttpOperationResponse, 'contents'>,
): IMediaTypeContent | undefined {
  return response.contents.find(content => content.mediaType === '*/*');
}

function findLowest2xx(httpResponses: IHttpOperationResponse[]): IHttpOperationResponse | undefined {
  const generic2xxResponse =
    findResponseByStatusCode(httpResponses, '2XX') || createResponseFromDefault(httpResponses, '200');
  const sorted2xxResponses = httpResponses
    .filter(response => response.code.match(/2\d\d/))
    .sort((a: IHttpOperationResponse, b: IHttpOperationResponse) => Number(a.code) - Number(b.code));

  return sorted2xxResponses[0] || generic2xxResponse;
}

function findResponseByStatusCode(
  responses: IHttpOperationResponse[],
  statusCode: string,
): IHttpOperationResponse | undefined {
  return responses.find(response => response.code.toLowerCase() === statusCode.toLowerCase());
}

function createResponseFromDefault(
  responses: IHttpOperationResponse[],
  statusCode: string,
): IHttpOperationResponse | undefined {
  const defaultResponse = responses.find(response => response.code === 'default');
  if (defaultResponse) {
    return Object.assign({}, defaultResponse, { code: statusCode });
  }
  return undefined;
}

function contentHasExamples(content: IMediaTypeContent): content is IWithExampleMediaContent {
  return !!content.examples && content.examples.length !== 0;
}

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
        return left(new Error(`Response for contentType: ${mediaType} and exampleKey: ${exampleKey} does not exist.`));
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
      return helpers
        .negotiateByPartialOptionsAndHttpContent(
          {
            code,
            dynamic,
            exampleKey,
          },
          httpContent,
        )
        .map(contentNegotiationResult => ({
          headers: response.headers || [],
          ...contentNegotiationResult,
        }));
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
  ): Reader<Logger, Either<Error, IHttpNegotiationResult>> {
    const { code, headers } = response;
    const { mediaTypes, dynamic, exampleKey } = desiredOptions;

    return withLogger(logger => {
      if (mediaTypes) {
        // a user provided mediaType
        const httpContent = hasContents(response) && findBestHttpContentByMediaType(response, mediaTypes);
        if (httpContent) {
          logger.success(`Found a compatible content for ${mediaTypes}`);
          // a httpContent for a provided mediaType exists
          return helpers
            .negotiateByPartialOptionsAndHttpContent(
              {
                code,
                dynamic,
                exampleKey,
              },
              httpContent,
            )
            .map(contentNegotiationResult => ({
              headers: headers || [],
              ...contentNegotiationResult,
            }));
        } else {
          logger.trace(`Unable to find a content for ${mediaTypes}, returning an empty text/plain response.`);
          return right({
            code,
            mediaType: 'text/plain',
            headers: headers || [],
          });
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
  ): Reader<Logger, Either<Error, IHttpNegotiationResult>> {
    const lowest2xxResponse = findLowest2xx(httpOperation.responses);
    if (lowest2xxResponse) {
      return helpers.negotiateOptionsBySpecificResponse(httpOperation, desiredOptions, lowest2xxResponse);
    }

    return reader.of(left(new Error('No 2** response defined, cannot mock')));
  },

  negotiateOptionsBySpecificCode(
    httpOperation: IHttpOperation,
    desiredOptions: NegotiationOptions,
    code: string,
  ): Reader<Logger, Either<Error, IHttpNegotiationResult>> {
    // find response by provided status code
    return withLogger(logger => {
      const result = findResponseByStatusCode(httpOperation.responses, code);
      if (!result) {
        logger.info(`Unable to find a ${code} response definition`);
        return createResponseFromDefault(httpOperation.responses, code);
      }

      return result;
    }).chain(responseByForcedStatusCode => {
      if (responseByForcedStatusCode) {
        return helpers
          .negotiateOptionsBySpecificResponse(httpOperation, desiredOptions, responseByForcedStatusCode)
          .chain(either =>
            either.fold(
              () =>
                helpers
                  .negotiateOptionsForDefaultCode(httpOperation, desiredOptions)
                  .map(innerEither =>
                    innerEither.mapLeft(error => new Error(`${error}. We tried default response, but we got ${error}`)),
                  ),
              result => reader.of(right(result)),
            ),
          );
      }

      return withLogger(logger => {
        logger.trace(`Unable to find default response to construct a ${code} response`);
        // if no response found under a status code throw an error
        return left(new Error('Requested status code is not defined in the schema.'));
      });
    });
  },

  negotiateOptionsForValidRequest(
    httpOperation: IHttpOperation,
    desiredOptions: NegotiationOptions,
  ): Reader<Logger, Either<Error, IHttpNegotiationResult>> {
    const { code } = desiredOptions;
    if (code) {
      return helpers.negotiateOptionsBySpecificCode(httpOperation, desiredOptions, code);
    }
    return helpers.negotiateOptionsForDefaultCode(httpOperation, desiredOptions);
  },

  negotiateOptionsForInvalidRequest(
    httpResponses: IHttpOperationResponse[],
  ): Reader<Logger, Either<Error, IHttpNegotiationResult>> {
    return withLogger(logger => {
      let result = findResponseByStatusCode(httpResponses, '422');
      if (!result) {
        logger.trace('Unable to find a 422 response definition');

        result = findResponseByStatusCode(httpResponses, '400');
        if (!result) {
          logger.trace('Unable to find a 400 response definition');
          return createResponseFromDefault(httpResponses, '422');
        }
      }

      logger.success(`Found response ${result.code}. I'll try with.`);
      return result;
    }).chain(response => {
      return withLogger(logger => {
        if (!response) {
          logger.trace('Unable to find a default response definition.');
          return left(new Error('No 422, 400, or default responses defined'));
        }

        // find first response with any static examples
        const contentWithExamples =
          response.contents && response.contents.find<IWithExampleMediaContent>(contentHasExamples);

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
      });
    });
  },
};

export default helpers;
