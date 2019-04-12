import { IPrismDiagnostic, IValidator } from '@stoplight/prism-core';
import { IHttpContent, IHttpHeaderParam, IHttpOperation, IHttpQueryParam } from '@stoplight/types';
import * as caseless from 'caseless';

import {
  IHttpConfig,
  IHttpNameValue,
  IHttpNameValues,
  IHttpRequest,
  IHttpResponse,
} from '../types';
import {
  header as headerDeserializerRegistry,
  query as queryDeserializerRegistry,
} from './deserializers';
import { resolveRequestValidationConfig, resolveResponseValidationConfig } from './utils/config';
import { findOperationResponse } from './utils/spec';
import {
  HttpBodyValidator,
  HttpHeadersValidator,
  HttpQueryValidator,
  IHttpValidator,
  validatorRegistry,
} from './validators';

export class HttpValidator
  implements IValidator<IHttpOperation, IHttpRequest, IHttpConfig, IHttpResponse> {
  constructor(
    private readonly bodyValidator: IHttpValidator<any, IHttpContent>,
    private readonly headersValidator: IHttpValidator<IHttpNameValue, IHttpHeaderParam>,
    private readonly queryValidator: IHttpValidator<IHttpNameValues, IHttpQueryParam>
  ) {}

  public async validateInput({
    resource,
    input,
    config: originalConfig,
  }: {
    resource: IHttpOperation;
    input: IHttpRequest;
    config?: IHttpConfig;
  }): Promise<IPrismDiagnostic[]> {
    const config = resolveRequestValidationConfig(originalConfig);
    const results: IPrismDiagnostic[] = [];
    const mediaType = caseless(input.headers || {}).get('content-type');

    // Replace resource.request in this function with request
    const { request } = resource;

    if (config.body) {
      const { body } = input;

      this.bodyValidator
        .validate(body, (request && request.body && request.body.contents) || [], mediaType)
        .forEach(validationResult => results.push(validationResult));
    }

    if (config.headers) {
      this.headersValidator
        .validate(input.headers || {}, (request && request.headers) || [], mediaType)
        .forEach(validationResult => results.push(validationResult));
    }

    if (config.query) {
      this.queryValidator
        .validate(input.url.query || {}, (request && request.query) || [], mediaType)
        .forEach(validationResult => results.push(validationResult));
    }

    return results;
  }

  public async validateOutput({
    resource,
    output,
    config: originalConfig,
  }: {
    resource: IHttpOperation;
    output?: IHttpResponse;
    config?: IHttpConfig;
  }): Promise<IPrismDiagnostic[]> {
    if (!output) {
      return [];
    }

    const config = resolveResponseValidationConfig(originalConfig);
    const results: IPrismDiagnostic[] = [];
    const mediaType = caseless(output.headers || {}).get('content-type');
    const responseSpec = findOperationResponse(resource.responses, output.statusCode);

    if (config.body) {
      this.bodyValidator
        .validate(output.body, (responseSpec && responseSpec.contents) || [], mediaType)
        .forEach(validationResult => results.push(validationResult));
    }

    if (config.headers) {
      this.headersValidator
        .validate(output.headers || {}, (responseSpec && responseSpec.headers) || [], mediaType)
        .forEach(validationResult => results.push(validationResult));
    }

    return results;
  }
}

export const validator = new HttpValidator(
  new HttpBodyValidator(validatorRegistry, 'body'),
  new HttpHeadersValidator(headerDeserializerRegistry, 'header'),
  new HttpQueryValidator(queryDeserializerRegistry, 'query')
);
