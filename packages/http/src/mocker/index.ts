import { IPrismComponents, IPrismInput, IPrismDiagnostic } from '@stoplight/prism-core';
import {
  DiagnosticSeverity,
  IHttpHeaderParam,
  IHttpOperation,
  INodeExample,
  IMediaTypeContent,
  IHttpOperationResponse,
} from '@stoplight/types';

import * as caseless from 'caseless';
import * as E from 'fp-ts/lib/Either';
import * as Record from 'fp-ts/lib/Record';
import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/lib/Array';
import * as R from 'fp-ts/lib/Reader';
import * as O from 'fp-ts/lib/Option';
import * as RE from 'fp-ts/lib/ReaderEither';
import { map } from 'fp-ts/lib/Array';
import { Do } from 'fp-ts-contrib/lib/Do';
import { isNumber, isString, keyBy, mapValues, groupBy, get, partial } from 'lodash';
import { Logger } from 'pino';
import { is } from 'type-is';
import {
  ContentExample,
  IHttpOperationConfig,
  IHttpRequest,
  IHttpResponse,
  IMockHttpConfig,
  PayloadGenerator,
  ProblemJsonError,
  JSONSchema,
} from '../types';
import withLogger from '../withLogger';
import { UNAUTHORIZED, UNPROCESSABLE_ENTITY } from './errors';
import { generate, generateStatic } from './generator/JSONSchema';
import helpers from './negotiator/NegotiatorHelpers';
import { IHttpNegotiationResult } from './negotiator/types';
import { runCallback } from './callback/callbacks';
import {
  decodeUriEntities,
  deserializeFormBody,
  findContentByMediaTypeOrFirst,
  splitUriParams,
} from '../validator/validators/body';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';

const eitherRecordSequence = Record.sequence(E.either);

const mock: IPrismComponents<IHttpOperation, IHttpRequest, IHttpResponse, IMockHttpConfig>['mock'] = ({
  resource,
  input,
  config,
}) => {
  const payloadGenerator: PayloadGenerator = config.dynamic ? generate : partial(generateStatic, resource);

  return pipe(
    withLogger(logger => {
      // setting default values
      const acceptMediaType = input.data.headers && caseless(input.data.headers).get('accept');
      if (!config.mediaTypes && acceptMediaType) {
        logger.info(`Request contains an accept header: ${acceptMediaType}`);
        config.mediaTypes = acceptMediaType.split(',');
      }

      return config;
    }),
    R.chain(mockConfig => negotiateResponse(mockConfig, input, resource)),
    R.chain(result => assembleResponse(result, payloadGenerator)),
    R.chain(response =>
      /*  Note: This is now just logging the errors without propagating them back. This might be moved as a first
          level concept in Prism.
      */
      logger =>
        pipe(
          response,
          E.map(response => runCallbacks({ resource, request: input.data, response })(logger)),
          E.chain(() => response)
        )
    )
  );
};

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
          map(callback =>
            runCallback({ callback, request: parseBodyIfUrlEncoded(request, resource), response })(logger)()
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
  const mediaType = caseless(request.headers || {}).get('content-type');
  if (!mediaType) return request;

  if (!is(mediaType, ['application/x-www-form-urlencoded'])) return request;

  const specs = pipe(
    O.fromNullable(resource.request),
    O.mapNullable(request => request.body),
    O.mapNullable(body => body.contents),
    O.getOrElse(() => [] as IMediaTypeContent[])
  );

  const encodedUriParams = splitUriParams(request.body as string);

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
    body: deserializeFormBody(content.schema, encodings, decodeUriEntities(encodedUriParams)),
  });
}

export function createInvalidInputResponse(
  failedValidations: NonEmptyArray<IPrismDiagnostic>,
  responses: IHttpOperationResponse[]
) {
  const securityValidation = failedValidations.find(validation => validation.code === 401);

  return pipe(
    withLogger(logger => logger.warn({ name: 'VALIDATOR' }, 'Request did not pass the validation rules')),
    R.chain(() =>
      pipe(
        helpers.negotiateOptionsForInvalidRequest(responses, securityValidation ? ['401'] : ['422', '400']),
        RE.mapLeft(() =>
          securityValidation
            ? createUnauthorisedResponse(securityValidation.tags)
            : createUnprocessableEntityResponse(failedValidations)
        )
      )
    )
  );
}

export const createUnauthorisedResponse = (tags?: string[]) =>
  ProblemJsonError.fromTemplate(
    UNAUTHORIZED,
    'Your request does not fullfil the security requirements and no HTTP unauthorized response was found in the spec, so Prism is generating this error for you.',
    tags && tags.length ? { headers: { 'WWW-Authenticate': tags.join(',') } } : undefined
  );

export const createUnprocessableEntityResponse = (validations: NonEmptyArray<IPrismDiagnostic>) =>
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

function negotiateResponse(
  mockConfig: IHttpOperationConfig,
  input: IPrismInput<IHttpRequest>,
  resource: IHttpOperation
) {
  const { [DiagnosticSeverity.Error]: errors, [DiagnosticSeverity.Warning]: warnings } = groupBy(
    input.validations,
    validation => validation.severity
  );

  if (errors && A.isNonEmpty(input.validations)) {
    return createInvalidInputResponse(input.validations, resource.responses);
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

function assembleResponse(
  result: E.Either<Error, IHttpNegotiationResult>,
  payloadGenerator: PayloadGenerator
): R.Reader<Logger, E.Either<Error, IHttpResponse>> {
  return logger =>
    Do(E.either)
      .bind('negotiationResult', result)
      .sequenceSL(({ negotiationResult }) => ({
        mockedBody: computeBody(negotiationResult, payloadGenerator),
        mockedHeaders: computeMockedHeaders(negotiationResult.headers || [], payloadGenerator),
      }))
      .return(negotiationResult => {
        const response: IHttpResponse = {
          statusCode: parseInt(negotiationResult.negotiationResult.code),
          headers: {
            ...negotiationResult.mockedHeaders,
            ...(negotiationResult.negotiationResult.mediaType && {
              'Content-type': negotiationResult.negotiationResult.mediaType,
            }),
          },
          body: negotiationResult.mockedBody,
        };

        logger.success(`Responding with the requested status code ${response.statusCode}`);

        return response;
      });
}

function isINodeExample(nodeExample: ContentExample | undefined): nodeExample is INodeExample {
  return !!nodeExample && 'value' in nodeExample;
}

function computeMockedHeaders(headers: IHttpHeaderParam[], payloadGenerator: PayloadGenerator) {
  return eitherRecordSequence(
    mapValues(
      keyBy(headers, h => h.name),
      header => {
        if (header.schema) {
          if (header.examples && header.examples.length > 0) {
            const example = header.examples[0];
            if (isINodeExample(example)) {
              return E.right(example.value);
            }
          } else {
            return pipe(
              payloadGenerator(header.schema),
              E.map(example => {
                if (isNumber(example) || isString(example)) return example;
                return null;
              })
            );
          }
        }
        return E.right(null);
      }
    )
  );
}

function computeBody(
  negotiationResult: Pick<IHttpNegotiationResult, 'schema' | 'mediaType' | 'bodyExample'>,
  payloadGenerator: PayloadGenerator
): E.Either<Error, unknown> {
  if (isINodeExample(negotiationResult.bodyExample) && negotiationResult.bodyExample.value !== undefined) {
    return E.right(negotiationResult.bodyExample.value);
  } else if (negotiationResult.schema) {
    return payloadGenerator(negotiationResult.schema);
  }
  return E.right(undefined);
}

export default mock;
