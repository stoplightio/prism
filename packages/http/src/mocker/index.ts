import { IPrismComponents, IPrismInput } from '@stoplight/prism-core';
import { DiagnosticSeverity, Dictionary, IHttpHeaderParam, IHttpOperation, INodeExample } from '@stoplight/types';

import * as caseless from 'caseless';
import * as Either from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import * as Reader from 'fp-ts/lib/Reader';
import * as Option from 'fp-ts/lib/Option';
import * as ReaderEither from 'fp-ts/lib/ReaderEither';
import { map } from 'fp-ts/lib/Array';
import { isEmpty, isObject, keyBy, mapValues, groupBy } from 'lodash';
import { Logger } from 'pino';
import {
  ContentExample,
  IHttpOperationConfig,
  IHttpRequest,
  IHttpResponse,
  IMockHttpConfig,
  PayloadGenerator,
  ProblemJsonError,
} from '../types';
import withLogger from '../withLogger';
import { UNAUTHORIZED, UNPROCESSABLE_ENTITY } from './errors';
import { generate, generateStatic } from './generator/JSONSchema';
import helpers from './negotiator/NegotiatorHelpers';
import { IHttpNegotiationResult } from './negotiator/types';
import { runCallback } from './callback/callbacks';

const mock: IPrismComponents<IHttpOperation, IHttpRequest, IHttpResponse, IMockHttpConfig>['mock'] = ({
  resource,
  input,
  config,
}) => {
  const payloadGenerator: PayloadGenerator = config.dynamic ? generate : generateStatic;

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
    Reader.chain(mockConfig => negotiateResponse(mockConfig, input, resource)),
    Reader.chain(result => assembleResponse(result, payloadGenerator)),
    Reader.chain(response =>
      /*  Note: This is now just logging the errors without propagating them back. This might be moved as a first
          level concept in Prism.
      */
      withLogger(logger =>
        pipe(
          response,
          Either.map(response => runCallbacks({ resource, request: input.data, response })(logger)),
          Either.chain(() => response)
        )
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
      Option.fromNullable(resource.callbacks),
      Option.map(callbacks =>
        pipe(
          callbacks,
          map(callback => runCallback({ callback, request, response })(logger)())
        )
      )
    )
  );
}

function handleInputValidation(input: IPrismInput<IHttpRequest>, resource: IHttpOperation) {
  const securityValidation = input.validations.find(validation => validation.code === 401);

  return pipe(
    withLogger(logger => logger.warn({ name: 'VALIDATOR' }, 'Request did not pass the validation rules')),
    Reader.chain(() =>
      pipe(
        helpers.negotiateOptionsForInvalidRequest(resource.responses, securityValidation ? ['401'] : ['422', '400']),
        ReaderEither.mapLeft(() =>
          securityValidation
            ? ProblemJsonError.fromTemplate(
                UNAUTHORIZED,
                '',
                securityValidation.tags && securityValidation.tags.length
                  ? {
                      headers: { 'WWW-Authenticate': securityValidation.tags.join(',') },
                    }
                  : undefined
              )
            : ProblemJsonError.fromTemplate(
                UNPROCESSABLE_ENTITY,
                'Your request is not valid and no HTTP validation response was found in the spec, so Prism is generating this error for you.',
                {
                  validation: input.validations.map(detail => ({
                    location: detail.path,
                    severity: DiagnosticSeverity[detail.severity],
                    code: detail.code,
                    message: detail.message,
                  })),
                }
              )
        )
      )
    )
  );
}

function negotiateResponse(
  mockConfig: IHttpOperationConfig,
  input: IPrismInput<IHttpRequest>,
  resource: IHttpOperation
) {
  const { [DiagnosticSeverity.Error]: errors, [DiagnosticSeverity.Warning]: warnings } = groupBy(
    input.validations,
    validation => validation.severity
  );

  if (errors) {
    return handleInputValidation(input, resource);
  } else {
    return pipe(
      withLogger(logger => {
        warnings && warnings.forEach(warn => logger.warn({ name: 'VALIDATOR' }, warn.message));
        return logger.success(
          { name: 'VALIDATOR' },
          'The request passed the validation rules. Looking for the best response'
        );
      }),
      Reader.chain(() => helpers.negotiateOptionsForValidRequest(resource, mockConfig))
    );
  }
}

function assembleResponse(
  result: Either.Either<Error, IHttpNegotiationResult>,
  payloadGenerator: PayloadGenerator
): Reader.Reader<Logger, Either.Either<Error, IHttpResponse>> {
  return withLogger(logger =>
    pipe(
      result,
      Either.map(negotiationResult => {
        const mockedBody = computeBody(negotiationResult, payloadGenerator);
        const mockedHeaders = computeMockedHeaders(negotiationResult.headers || [], payloadGenerator);

        const response: IHttpResponse = {
          statusCode: parseInt(negotiationResult.code),
          headers: {
            ...mockedHeaders,
            ...(negotiationResult.mediaType && { 'Content-type': negotiationResult.mediaType }),
          },
          body: mockedBody,
        };

        logger.success(`Responding with the requested status code ${response.statusCode}`);

        return response;
      })
    )
  );
}

function isINodeExample(nodeExample: ContentExample | undefined): nodeExample is INodeExample {
  return !!nodeExample && 'value' in nodeExample;
}

function computeMockedHeaders(headers: IHttpHeaderParam[], payloadGenerator: PayloadGenerator): Dictionary<string> {
  return mapValues(
    keyBy(headers, h => h.name),
    header => {
      if (header.schema) {
        if (header.examples && header.examples.length > 0) {
          const example = header.examples[0];
          if (isINodeExample(example)) {
            return example.value;
          }
        } else {
          const example = payloadGenerator(header.schema);
          if (!(isObject(example) && isEmpty(example))) return example;
        }
      }
      return null;
    }
  );
}

function computeBody(
  negotiationResult: Pick<IHttpNegotiationResult, 'schema' | 'mediaType' | 'bodyExample'>,
  payloadGenerator: PayloadGenerator
) {
  if (isINodeExample(negotiationResult.bodyExample) && negotiationResult.bodyExample.value !== undefined) {
    return negotiationResult.bodyExample.value;
  } else if (negotiationResult.schema) {
    return payloadGenerator(negotiationResult.schema);
  }
  return undefined;
}

export default mock;
