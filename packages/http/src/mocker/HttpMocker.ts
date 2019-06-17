import { IMocker, IMockerOpts } from '@stoplight/prism-core';
import { Dictionary, IHttpHeaderParam, IHttpOperation, INodeExample, INodeExternalExample } from '@stoplight/types';

import * as caseless from 'caseless';
import { isEmpty, isObject, keyBy, mapValues } from 'lodash';
import {
  IHttpConfig,
  IHttpOperationConfig,
  IHttpRequest,
  IHttpResponse,
  PayloadGenerator,
  ProblemJsonError,
} from '../types';
import { UNPROCESSABLE_ENTITY } from './errors';
import { generate, generateStatic } from './generator/JSONSchema';
import helpers from './negotiator/NegotiatorHelpers';
import { IHttpNegotiationResult } from './negotiator/types';

export class HttpMocker implements IMocker<IHttpOperation, IHttpRequest, IHttpConfig, IHttpResponse> {
  public mock({
    resource,
    input,
    config,
  }: Partial<IMockerOpts<IHttpOperation, IHttpRequest, IHttpConfig>>): IHttpResponse {
    let payloadGenerator: PayloadGenerator = generateStatic;

    if (config && typeof config.mock !== 'boolean' && config.mock.dynamic) {
      payloadGenerator = generate;
    }

    // pre-requirements check
    if (!resource) {
      throw new Error('Resource is not defined');
    }

    if (!input) {
      throw new Error('Http request is not defined');
    }

    // setting default values
    const acceptMediaType = input.data.headers && caseless(input.data.headers).get('accept');
    config = config || { mock: false };
    const mockConfig: IHttpOperationConfig =
      config.mock === false ? { dynamic: false } : Object.assign({}, config.mock);

    if (!mockConfig.mediaTypes && acceptMediaType) {
      mockConfig.mediaTypes = acceptMediaType.split(',');
    }

    // looking up proper example
    let negotiationResult: IHttpNegotiationResult;
    if (input.validations.input.length > 0) {
      try {
        negotiationResult = helpers.negotiateOptionsForInvalidRequest(resource.responses);
      } catch (error) {
        throw ProblemJsonError.fromTemplate(
          UNPROCESSABLE_ENTITY,
          `Your request body is not valid: ${JSON.stringify(input.validations.input)}`,
        );
      }
    } else {
      negotiationResult = helpers.negotiateOptionsForValidRequest(resource, mockConfig);
    }

    const mockedBody = computeBody(negotiationResult, payloadGenerator);
    const mockedHeaders = computeMockedHeaders(negotiationResult.headers || [], payloadGenerator);

    return {
      statusCode: parseInt(negotiationResult.code),
      headers: {
        ...mockedHeaders,
        'Content-type': negotiationResult.mediaType,
      },
      body: mockedBody,
    };
  }
}

function isINodeExample(nodeExample: INodeExample | INodeExternalExample | undefined): nodeExample is INodeExample {
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
