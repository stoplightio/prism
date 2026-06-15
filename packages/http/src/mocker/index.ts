import { IPrismComponents, IPrismDiagnostic, IPrismInput } from '@stoplight/prism-core';
import {
  DiagnosticSeverity,
  Dictionary,
  IHttpHeaderParam,
  IHttpOperation,
  IHttpOperationResponse,
  IMediaTypeContent,
  INodeExample,
} from '@stoplight/types';

import * as caseless from 'caseless';
import * as chalk from 'chalk';
import * as E from 'fp-ts/Either';
import * as Record from 'fp-ts/Record';
import { pipe } from 'fp-ts/function';
import * as A from 'fp-ts/Array';
import * as R from 'fp-ts/Reader';
import * as O from 'fp-ts/Option';
import * as RE from 'fp-ts/ReaderEither';
import * as TE from 'fp-ts/TaskEither';
import { get, groupBy, isNumber, isString, pick } from 'lodash';
import { Logger } from 'pino';
import { is } from 'type-is';
import {
  ContentExample,
  IHttpMockConfig,
  IHttpOperationConfig,
  IHttpRequest,
  IHttpResponse,
  PayloadGenerator,
  ProblemJsonError,
} from '../types';
import withLogger from '../withLogger';
import { UNAUTHORIZED, UNPROCESSABLE_ENTITY, INVALID_CONTENT_TYPE, SCHEMA_TOO_COMPLEX } from './errors';
import { generate, generateStatic, SchemaTooComplexGeneratorError } from './generator/JSONSchema';
import helpers from './negotiator/NegotiatorHelpers';
import { IHttpNegotiationResult } from './negotiator/types';
import { runCallback } from './callback/callbacks';
import { logRequest, logResponse } from '../utils/logger';
import { JSONSchema } from '../types';
import {
  decodeUriEntities,
  deserializeFormBody,
  findContentByMediaTypeOrFirst,
  splitUriParams,
  parseMultipartFormDataParams,
} from '../validator/validators/body';
import { parseMIMEHeader } from '../validator/validators/headers';
import { NonEmptyArray } from 'fp-ts/NonEmptyArray';
export {
  resetGenerator as resetJSONSchemaGenerator,
  setGeneratorOption as setJSONSchemaGeneratorOption,
} from './generator/JSONSchema';

const mock: IPrismComponents<IHttpOperation, IHttpRequest, IHttpResponse, IHttpMockConfig>['mock'] = ({
  resource,
  input,
  config,
}) => {
  function createPayloadGenerator(config: IHttpOperationConfig, resource: IHttpOperation): PayloadGenerator {
    return (source: JSONSchema) => {
      return config.dynamic
        ? generate(resource, resource['__bundled__'], source, config.seed)
        : TE.fromEither(generateStatic(resource, source));
    };
  }
  const payloadGenerator = createPayloadGenerator(config, resource);

  return logger => {
    const syncResult = pipe(
      withLogger(l => {
        logRequest({ logger: l, prefix: `${chalk.grey('< ')}`, ...pick(input.data, 'body', 'headers') });

        const acceptMediaType = input.data.headers && caseless(input.data.headers).get('accept');
        if (!config.mediaTypes && acceptMediaType) {
          l.info(`Request contains an accept header: ${acceptMediaType}`);
          config.mediaTypes = acceptMediaType.split(',');
        }
        return config;
      }),
      R.chain(mockConfig => negotiateResponse(mockConfig, input, resource)),
      R.chain(result => negotiateDeprecation(result, resource))
    )(logger);

    return pipe(
      TE.fromEither(syncResult),
      TE.chain(negotiationResult =>
        assembleResponse(E.right(negotiationResult), payloadGenerator, config.ignoreExamples ?? false)(logger)
      ),
      TE.map(response => {
        mockResponseLogger(logger)(response);
        runCallbacks({ resource, request: input.data, response })(logger);
        return response;
      })
    );
  };
};

function mockResponseLogger(logger: Logger) {
  const prefix = chalk.grey('> ');

  return (response: IHttpResponse) => {
    logger.info(`${prefix}Responding with "${response.statusCode}"`);

    logResponse({
      logger,
      prefix,
      ...pick(response, 'statusCode', 'body', 'headers'),
    });

    return response;
  };
}

function runCallbacks({
  resource,
  request,
  response,
}: {
  resource: IHttpOperation;
  request: IHttpRequest;
  response: IHttpResponse;
}) {
  return withLogger(logger =>
    pipe(
      O.fromNullable(resource.callbacks),
      O.map(callbacks =>
        pipe(
          callbacks,
          A.map(callback =>
            runCallback({ callback, request: parseBodyIfUrlEncoded(request, resource), response })(
              logger.child({ name: 'CALLBACK' })
            )()
          )
        )
      )
    )
  );
}

/*
  This function should not be here at all, but unfortunately due to some limitations of the Monad we're using (Either)
  we cannot carry parsed informations in case of an error — which is what we do need instead.
*/
function parseBodyIfUrlEncoded(request: IHttpRequest, resource: IHttpOperation) {
  const contentTypeHeader = caseless(request.headers || {}).get('content-type');
  if (!contentTypeHeader) return request;
  const [multipartBoundary, mediaType] = parseMIMEHeader(contentTypeHeader);

  if (!is(mediaType, ['application/x-www-form-urlencoded', 'multipart/form-data'])) return request;

  const specs = pipe(
    O.fromNullable(resource.request),
    O.chainNullableK(request => request.body),
    O.chainNullableK(body => body.contents),
    O.getOrElse(() => [] as IMediaTypeContent[])
  );

  const requestBody = request.body as string;
  const encodedUriParams = pipe(
    mediaType === 'multipart/form-data'
      ? parseMultipartFormDataParams(requestBody, multipartBoundary)
      : splitUriParams(requestBody),
    E.getOrElse<IPrismDiagnostic[], Dictionary<string>>(() => ({}) as Dictionary<string>)
  );

  if (specs.length < 1) {
    return Object.assign(request, { body: encodedUriParams });
  }

  const content = pipe(
    O.fromNullable(mediaType),
    O.chain(mediaType => findContentByMediaTypeOrFirst(specs, mediaType)),
    O.map(({ content }) => content),
    O.getOrElse(() => specs[0] || {})
  );

  const encodings = get(content, 'encodings', []);

  if (!content.schema) return Object.assign(request, { body: encodedUriParams });

  return Object.assign(request, {
    body: deserializeFormBody(content.schema, encodings, decodeUriEntities(encodedUriParams, mediaType)),
  });
}

export function createInvalidInputResponse(
  failedValidations: NonEmptyArray<IPrismDiagnostic>,
  responses: IHttpOperationResponse[],
  mockConfig: IHttpOperationConfig
): R.Reader<Logger, E.Either<ProblemJsonError, IHttpNegotiationResult>> {
  const expectedCodes = getExpectedCodesForViolations(failedValidations);
  const isExampleKeyFromExpectedCodes = !!mockConfig.code && expectedCodes.includes(mockConfig.code);

  return pipe(
    withLogger(logger => {
      logger.warn({ name: 'VALIDATOR' }, 'Request did not pass the validation rules');
      failedValidations.map(failedValidation => logger.error({ name: 'VALIDATOR' }, failedValidation.message));
    }),
    R.chain(() =>
      pipe(
        helpers.negotiateOptionsForInvalidRequest(
          responses,
          expectedCodes,
          isExampleKeyFromExpectedCodes ? mockConfig.exampleKey : undefined
        ),
        RE.mapLeft(error => {
          if (error instanceof ProblemJsonError && error.status === 404) {
            return error;
          }
          return createResponseForViolations(failedValidations);
        })
      )
    )
  );
}

function getExpectedCodesForViolations(failedValidations: NonEmptyArray<IPrismDiagnostic>): NonEmptyArray<number> {
  const hasSecurityViolations = findValidationByCode(failedValidations, 401);
  if (hasSecurityViolations) {
    return [401];
  }

  const hasInvalidContentTypeViolations = findValidationByCode(failedValidations, 415);
  if (hasInvalidContentTypeViolations) {
    return [415, 422, 400];
  }

  return [422, 400];
}

function createResponseForViolations(failedValidations: NonEmptyArray<IPrismDiagnostic>) {
  const securityViolation = findValidationByCode(failedValidations, 401);
  if (securityViolation) {
    return createUnauthorisedResponse(securityViolation.tags);
  }

  const invalidContentViolation = findValidationByCode(failedValidations, 415);
  if (invalidContentViolation) {
    return createInvalidContentTypeResponse(invalidContentViolation);
  }

  return createUnprocessableEntityResponse(failedValidations);
}

function findValidationByCode(validations: NonEmptyArray<IPrismDiagnostic>, code: string | number) {
  return validations.find(validation => validation.code === code);
}

export const createUnauthorisedResponse = (tags?: string[]): ProblemJsonError =>
  ProblemJsonError.fromTemplate(
    UNAUTHORIZED,
    'Your request does not fullfil the security requirements and no HTTP unauthorized response was found in the spec, so Prism is generating this error for you.',
    tags && tags.length ? { headers: { 'WWW-Authenticate': tags.join(',') } } : undefined
  );

export const createUnprocessableEntityResponse = (validations: NonEmptyArray<IPrismDiagnostic>): ProblemJsonError =>
  ProblemJsonError.fromTemplate(
    UNPROCESSABLE_ENTITY,
    'Your request is not valid and no HTTP validation response was found in the spec, so Prism is generating this error for you.',
    {
      validation: validations.map(detail => ({
        location: detail.path,
        severity: DiagnosticSeverity[detail.severity],
        code: detail.code,
        message: detail.message,
      })),
    }
  );

export const createInvalidContentTypeResponse = (validation: IPrismDiagnostic): ProblemJsonError =>
  ProblemJsonError.fromTemplate(INVALID_CONTENT_TYPE, validation.message);

function negotiateResponse(
  mockConfig: IHttpOperationConfig,
  input: IPrismInput<IHttpRequest>,
  resource: IHttpOperation
): RE.ReaderEither<Logger, Error, IHttpNegotiationResult> {
  const { [DiagnosticSeverity.Error]: errors, [DiagnosticSeverity.Warning]: warnings } = groupBy(
    input.validations,
    validation => validation.severity
  );

  if (errors && A.isNonEmpty(input.validations)) {
    return createInvalidInputResponse(input.validations, resource.responses, mockConfig);
  } else {
    return pipe(
      withLogger(logger => {
        warnings && warnings.forEach(warn => logger.warn({ name: 'VALIDATOR' }, warn.message));
        return logger.success(
          { name: 'VALIDATOR' },
          'The request passed the validation rules. Looking for the best response'
        );
      }),
      R.chain(() => helpers.negotiateOptionsForValidRequest(resource, mockConfig))
    );
  }
}

function negotiateDeprecation(
  result: E.Either<Error, IHttpNegotiationResult>,
  httpOperation: IHttpOperation
): RE.ReaderEither<Logger, Error, IHttpNegotiationResult> {
  if (httpOperation.deprecated) {
    return pipe(
      withLogger(logger => {
        logger.info('Adding "Deprecation" header since operation is deprecated');
        return result;
      }),
      RE.map(result => ({
        ...result,
        deprecated: true,
      }))
    );
  }
  return RE.fromEither(result);
}

const assembleResponse =
  (
    result: E.Either<Error, IHttpNegotiationResult>,
    payloadGenerator: PayloadGenerator,
    ignoreExamples: boolean
  ): R.Reader<Logger, TE.TaskEither<Error, IHttpResponse>> =>
  logger =>
    pipe(
      TE.fromEither(result),
      TE.chain(negotiationResult =>
        pipe(
          computeBody(negotiationResult, payloadGenerator, ignoreExamples),
          TE.chain(body =>
            pipe(
              computeMockedHeaders(negotiationResult.headers || [], payloadGenerator),
              TE.map(mockedHeaders => ({
                statusCode: parseInt(negotiationResult.code),
                headers: {
                  ...mockedHeaders,
                  ...(negotiationResult.mediaType && {
                    'Content-type': negotiationResult.mediaType,
                  }),
                  ...(negotiationResult.deprecated && {
                    deprecation: 'true',
                  }),
                },
                body,
              }))
            )
          ),
          TE.map(response => {
            logger.success(`Responding with the requested status code ${response.statusCode}`);
            return response;
          })
        )
      )
    );

function isINodeExample(nodeExample: ContentExample | undefined): nodeExample is INodeExample {
  return !!nodeExample && 'value' in nodeExample;
}

function computeMockedHeaders(
  headers: IHttpHeaderParam[],
  payloadGenerator: PayloadGenerator
): TE.TaskEither<Error, IHttpResponse['headers']> {
  const headerEntries = headers.map(header => {
    if (header.schema) {
      if (header.examples && header.examples.length > 0) {
        const example = header.examples[0];
        if (isINodeExample(example)) {
          return TE.right<Error, [string, string | null]>([header.name, String(example.value)]);
        }
      } else {
        return pipe(
          payloadGenerator(header.schema),
          mapPayloadGeneratorErrorTE('header'),
          TE.map((example): [string, string | null] => {
            const value = isNumber(example) || isString(example) ? String(example) : null;
            return [header.name, value];
          })
        );
      }
    }
    return TE.right<Error, [string, string | null]>([header.name, null]);
  });

  return pipe(
    headerEntries.reduce<TE.TaskEither<Error, Record<string, string>>>(
      (acc, entry) =>
        pipe(
          acc,
          TE.chain(record =>
            pipe(
              entry,
              TE.map(([name, value]) => {
                if (value !== null) {
                  return { ...record, [name]: value };
                }
                return record;
              })
            )
          )
        ),
      TE.right({})
    )
  );
}

function computeBody(
  negotiationResult: Pick<IHttpNegotiationResult, 'schema' | 'mediaType' | 'bodyExample'>,
  payloadGenerator: PayloadGenerator,
  ignoreExamples: boolean
): TE.TaskEither<Error, unknown> {
  if (
    !ignoreExamples &&
    isINodeExample(negotiationResult.bodyExample) &&
    negotiationResult.bodyExample.value !== undefined
  ) {
    return TE.right(negotiationResult.bodyExample.value);
  }
  if (negotiationResult.schema) {
    return pipe(payloadGenerator(negotiationResult.schema), mapPayloadGeneratorErrorTE('body'));
  }
  return TE.right(undefined);
}

const mapPayloadGeneratorErrorTE = (source: string) =>
  TE.mapLeft<Error, Error>(err => {
    if (err instanceof SchemaTooComplexGeneratorError) {
      return ProblemJsonError.fromTemplate(
        SCHEMA_TOO_COMPLEX,
        `Unable to generate ${source} for response. The schema is too complex to generate.`
      );
    }
    return err;
  });

export default mock;
