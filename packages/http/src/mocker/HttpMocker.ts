import { IMocker, IMockerOpts } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';

import { IHttpConfig, IHttpRequest, IHttpResponse } from '../types';
import { getHeaderByName } from '../validator/utils/http';
import { IExampleGenerator } from './generator/IExampleGenerator';
import helpers from './negotiator/NegotiatorHelpers';

export class HttpMocker
  implements IMocker<IHttpOperation, IHttpRequest, IHttpConfig, IHttpResponse> {
  constructor(private _exampleGenerator: IExampleGenerator<any>) { }

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
    const inputMediaType =
      input.data.headers && getHeaderByName(input.data.headers, 'content-type');
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
        return {
          statusCode: 500,
          headers: {
            'Content-type': 'application/json',
          },
          body: JSON.stringify({ errors: input.validations.input }),
        };
      }
    } else {
      negotiationResult = helpers.negotiateOptionsForValidRequest(resource, mockConfig);
    }

    // preparing response body
    let body;
    const { code, example = null, mediaType, schema = null } = negotiationResult;

    if (example && 'value' in example && example.value !== undefined) {
      body = typeof example.value === 'string' ? example.value : JSON.stringify(example.value);
    } else if (schema) {
      body = await this._exampleGenerator.generate(schema, mediaType);
    }

    return {
      statusCode: parseInt(code),
      headers: { 'Content-type': mediaType },
      body,
    };
  }
}
