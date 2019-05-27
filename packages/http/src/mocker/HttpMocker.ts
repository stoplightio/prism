import { IMocker, IMockerOpts } from '@stoplight/prism-core';
import { Dictionary, IHttpHeaderParam, IHttpOperation, INodeExample } from '@stoplight/types';

import * as caseless from 'caseless';
import { fromPairs, isEmpty, isObject, keyBy, mapValues, toPairs } from 'lodash';
import pino from '../logger';
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

export class HttpMocker implements IMocker<IHttpOperation, IHttpRequest, IHttpConfig, IHttpResponse> {
  constructor(private _exampleGenerator: PayloadGenerator) {}

  public async mock({
    resource,
    input,
    config,
  }: Partial<IMockerOpts<IHttpOperation, IHttpRequest, IHttpConfig>>): Promise<IHttpResponse> {
    // pre-requirements check
    if (!resource) {
      throw new Error('Resource is not defined');
    }

    if (!input) {
      throw new Error('Http request is not defined');
    }

    // setting default values
    const inputMediaType = input.data.headers && caseless(input.data.headers).get('content-type');
    config = config || { mock: false };
    const mockConfig: IHttpOperationConfig =
      config.mock === false ? { dynamic: false } : Object.assign({}, config.mock);

    if (!mockConfig.mediaType && typeof inputMediaType === 'string') {
      pino.info(`Request contains a content-type header: ${inputMediaType}`);
      mockConfig.mediaType = inputMediaType;
    }

    // looking up proper example
    let negotiationResult: IHttpNegotiationResult;
    if (input.validations.input.length > 0) {
      try {
        pino.warn('The request did not pass the validation rules. Looking for an invalid response');
        negotiationResult = helpers.negotiateOptionsForInvalidRequest(resource.responses);
      } catch (error) {
        pino.info('No suitable response found, creating a 422 response based on validation responses');
        throw ProblemJsonError.fromTemplate(
          UNPROCESSABLE_ENTITY,
          `Your request body is not valid: ${JSON.stringify(input.validations.input)}`,
        );
      }
    } else {
      pino.success('The request passed the validation rules. Looking for the best response');
      negotiationResult = helpers.negotiateOptionsForValidRequest(resource, mockConfig);
    }

    const [body, mockedHeaders] = await Promise.all([
      computeBody(negotiationResult, this._exampleGenerator),
      computeMockedHeaders(negotiationResult.headers, this._exampleGenerator),
    ]);

    return {
      statusCode: parseInt(negotiationResult.code),
      headers: {
        ...mockedHeaders,
        'Content-type': negotiationResult.mediaType,
      },
      body,
    };
  }
}

function isINodeExample(nodeExample: ContentExample | undefined): nodeExample is INodeExample {
  return !!nodeExample && 'value' in nodeExample;
}

function computeMockedHeaders(headers: IHttpHeaderParam[], ex: PayloadGenerator): Promise<Dictionary<string>> {
  const headerWithPromiseValues = mapValues(keyBy(headers, h => h.name), async header => {
    if (header.content) {
      if (header.content.examples.length > 0) {
        const example = header.content.examples[0];
        if (isINodeExample(example)) {
          return example.value;
        }
      }
      if (header.content.schema) {
        const example = await ex(header.content.schema);
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
