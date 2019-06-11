import { IMocker, IMockerOpts } from '@stoplight/prism-core';
import { Dictionary, IHttpHeaderParam, IHttpOperation, INodeExample } from '@stoplight/types';

import * as caseless from 'caseless';
import { Either } from 'fp-ts/lib/Either';
import { Reader } from 'fp-ts/lib/Reader';
import { fromPairs, isEmpty, isObject, keyBy, mapValues, toPairs } from 'lodash';
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
import { UNPROCESSABLE_ENTITY } from './errors';
import helpers from './negotiator/NegotiatorHelpers';
import { IHttpNegotiationResult } from './negotiator/types';

export class HttpMocker
  implements IMocker<IHttpOperation, IHttpRequest, IHttpConfig, Reader<Logger, Either<Error, Promise<IHttpResponse>>>> {
  constructor(private _exampleGenerator: PayloadGenerator) {}

  public mock({
    resource,
    input,
    config,
  }: Partial<IMockerOpts<IHttpOperation, IHttpRequest, IHttpConfig>>): Reader<
    Logger,
    Either<Error, Promise<IHttpResponse>>
  > {
    // pre-requirements check
    if (!resource) {
      throw new Error('Resource is not defined');
    }

    if (!input) {
      throw new Error('Http request is not defined');
    }

    return new Reader<Logger, IHttpOperationConfig>(logger => {
      // setting default values
      const acceptMediaType = input.data.headers && caseless(input.data.headers).get('accept');
      config = config || { mock: false };
      const mockConfig: IHttpOperationConfig =
        config.mock === false ? { dynamic: false } : Object.assign({}, config.mock);

      if (!mockConfig.mediaTypes && acceptMediaType) {
        mockConfig.mediaTypes = acceptMediaType.split(',');
      }

      return mockConfig;
    })
      .chain(mockConfig => {
        if (input.validations.input.length > 0) {
          return new Reader<Logger, unknown>(logger => logger.warn('Request did not pass the validation rules')).chain(
            () =>
              helpers
                .negotiateOptionsForInvalidRequest(resource.responses)
                .map(e =>
                  e.mapLeft(() =>
                    ProblemJsonError.fromTemplate(
                      UNPROCESSABLE_ENTITY,
                      `Your request body is not valid: ${JSON.stringify(input.validations.input)}`,
                    ),
                  ),
                ),
          );
        } else {
          return new Reader<Logger, unknown>(logger =>
            logger.success('The request passed the validation rules. Looking for the best response'),
          ).chain(() => helpers.negotiateOptionsForValidRequest(resource, mockConfig));
        }
      })
      .chain(result => {
        return new Reader<Logger, Either<Error, Promise<IHttpResponse>>>(logger => {
          return result.map(async negotiationResult => {
            const [body, mockedHeaders] = await Promise.all([
              computeBody(negotiationResult, this._exampleGenerator),
              computeMockedHeaders(negotiationResult.headers || [], this._exampleGenerator),
            ]);

            const response: IHttpResponse = {
              statusCode: parseInt(negotiationResult.code),
              headers: {
                ...mockedHeaders,
                'Content-type': negotiationResult.mediaType,
              },
              body,
            };

            logger.success(`Responding with ${response.statusCode}`);

            return response;
          });
        });
      });
  }
}

function isINodeExample(nodeExample: ContentExample | undefined): nodeExample is INodeExample {
  return !!nodeExample && 'value' in nodeExample;
}

function computeMockedHeaders(headers: IHttpHeaderParam[], ex: PayloadGenerator): Promise<Dictionary<string>> {
  const headerWithPromiseValues = mapValues(keyBy(headers, h => h.name), async header => {
    if (header.schema) {
      if (header.examples && header.examples.length > 0) {
        const example = header.examples[0];
        if (isINodeExample(example)) {
          return example.value;
        }
      } else {
        const example = await ex(header.schema);
        if (!(isObject(example) && isEmpty(example))) return example;
      }
    }
    return '';
  });

  return resolvePromiseInProps(headerWithPromiseValues);
}

async function computeBody(
  negotiationResult: Pick<IHttpNegotiationResult, 'schema' | 'mediaType' | 'bodyExample'>,
  ex: PayloadGenerator,
) {
  if (isINodeExample(negotiationResult.bodyExample) && negotiationResult.bodyExample.value !== undefined) {
    return negotiationResult.bodyExample.value;
  } else if (negotiationResult.schema) {
    return ex(negotiationResult.schema);
  }
  return undefined;
}

async function resolvePromiseInProps(val: Dictionary<Promise<string>>): Promise<Dictionary<string>> {
  const promisePair = await Promise.all(toPairs(val).map(v => Promise.all(v)));
  return fromPairs(promisePair);
}
