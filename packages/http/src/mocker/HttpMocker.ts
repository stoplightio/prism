import { IMocker, IMockerOpts, IPrismInput } from '@stoplight/prism-core';
import { DiagnosticSeverity, Dictionary, IHttpHeaderParam, IHttpOperation, INodeExample } from '@stoplight/types';

import * as caseless from 'caseless';
import { Either } from 'fp-ts/lib/Either';
import { Reader } from 'fp-ts/lib/Reader';
import { isEmpty, isObject, keyBy, mapValues } from 'lodash';
import { Logger } from 'pino';
import {
  ContentExample,
  IHttpConfig,
  IHttpOperationConfig,
  IHttpRequest,
  IHttpResponse,
  PayloadGenerator,
  ProblemJsonError,
} from '../types';
import withLogger from '../withLogger';
import { UNPROCESSABLE_ENTITY } from './errors';
import { generate, generateStatic } from './generator/JSONSchema';
import helpers from './negotiator/NegotiatorHelpers';
import { IHttpNegotiationResult } from './negotiator/types';

export class HttpMocker
  implements IMocker<IHttpOperation, IHttpRequest, IHttpConfig, Reader<Logger, Either<Error, IHttpResponse>>> {
  public mock({
    resource,
    input,
    config,
  }: IMockerOpts<IHttpOperation, IHttpRequest, IHttpConfig>): Reader<Logger, Either<Error, IHttpResponse>> {
    const payloadGenerator: PayloadGenerator =
      config && typeof config.mock !== 'boolean' && config.mock.dynamic ? generate : generateStatic;

    return withLogger(logger => {
      // setting default values
      const acceptMediaType = input.data.headers && caseless(input.data.headers).get('accept');
      config = config || { mock: false };
      const mockConfig: IHttpOperationConfig =
        config.mock === false ? { dynamic: false } : Object.assign({}, config.mock);

      if (!mockConfig.mediaTypes && acceptMediaType) {
        logger.info(`Request contains an accept header: ${acceptMediaType}`);
        mockConfig.mediaTypes = acceptMediaType.split(',');
      }

      return mockConfig;
    })
      .chain(mockConfig => negotiateResponse(mockConfig, input, resource))
      .chain(result => assembleResponse(result, payloadGenerator));
  }
}

function negotiateResponse(
  mockConfig: IHttpOperationConfig,
  input: IPrismInput<IHttpRequest>,
  resource: IHttpOperation,
) {
  if (input.validations.input.length > 0) {
    return withLogger(logger => logger.warn('Request did not pass the validation rules')).chain(() =>
      helpers.negotiateOptionsForInvalidRequest(resource.responses).map(e =>
        e.mapLeft(() =>
          ProblemJsonError.fromTemplate(
            UNPROCESSABLE_ENTITY,
            'Your request body is not valid and no HTTP validation response was found in the spec, so Prism is generating this error for you.',
            {
              validation: input.validations.input.map(detail => ({
                location: detail.path,
                severity: DiagnosticSeverity[detail.severity],
                code: detail.code,
                message: detail.message,
              })),
            },
          ),
        ),
      ),
    );
  } else {
    return withLogger(logger =>
      logger.success('The request passed the validation rules. Looking for the best response'),
    ).chain(() => helpers.negotiateOptionsForValidRequest(resource, mockConfig));
  }
}

function assembleResponse(
  result: Either<Error, IHttpNegotiationResult>,
  payloadGenerator: PayloadGenerator,
): Reader<Logger, Either<Error, IHttpResponse>> {
  return withLogger(logger =>
    result.map(negotiationResult => {
      const mockedBody = computeBody(negotiationResult, payloadGenerator);
      const mockedHeaders = computeMockedHeaders(negotiationResult.headers || [], payloadGenerator);

      const response: IHttpResponse = {
        statusCode: parseInt(negotiationResult.code),
        headers: {
          ...mockedHeaders,
          'Content-type': negotiationResult.mediaType,
        },
        body: mockedBody,
      };

      logger.success(`Responding with the requested status code ${response.statusCode}`);

      return response;
    }),
  );
}

function isINodeExample(nodeExample: ContentExample | undefined): nodeExample is INodeExample {
  return !!nodeExample && 'value' in nodeExample;
}

function computeMockedHeaders(headers: IHttpHeaderParam[], payloadGenerator: PayloadGenerator): Dictionary<string> {
  return mapValues(keyBy(headers, h => h.name), header => {
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
  });
}

function computeBody(
  negotiationResult: Pick<IHttpNegotiationResult, 'schema' | 'mediaType' | 'bodyExample'>,
  payloadGenerator: PayloadGenerator,
) {
  if (isINodeExample(negotiationResult.bodyExample) && negotiationResult.bodyExample.value !== undefined) {
    return negotiationResult.bodyExample.value;
  } else if (negotiationResult.schema) {
    return payloadGenerator(negotiationResult.schema);
  }
  return undefined;
}
