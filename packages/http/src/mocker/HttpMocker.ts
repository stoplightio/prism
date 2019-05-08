import { IMocker, IMockerOpts } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';

import * as caseless from 'caseless';
import { IHttpConfig, IHttpRequest, IHttpResponse, ProblemJsonError } from '../types';
import { UNPROCESSABLE_ENTITY } from './errors';
import { IExampleGenerator } from './generator/IExampleGenerator';
import helpers from './negotiator/NegotiatorHelpers';

export class HttpMocker implements IMocker<IHttpOperation, IHttpRequest, IHttpConfig, IHttpResponse> {
  constructor(private _exampleGenerator: IExampleGenerator) {}

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
    config = config || { mock: {} };
    const mockConfig: any = typeof config.mock === 'boolean' ? {} : Object.assign({}, config.mock);
    if (!mockConfig.mediaType && inputMediaType) {
      mockConfig.mediaType = inputMediaType;
    }

    // looking up proper example
    let negotiationResult;
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

    // preparing response body
    let body;
    const example = negotiationResult.example;

    if (example && 'value' in example && example.value !== undefined) {
      body = typeof example.value === 'string' ? example.value : JSON.stringify(example.value);
    } else if (negotiationResult.schema) {
      body = await this._exampleGenerator.generate(negotiationResult.schema, negotiationResult.mediaType);
    }

    return {
      statusCode: parseInt(negotiationResult.code),
      headers: {
        'Content-type': negotiationResult.mediaType,
      },
      body,
    };
  }
}
