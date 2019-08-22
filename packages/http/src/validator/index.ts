import { IPrismDiagnostic, IValidator } from '@stoplight/prism-core';
import { DiagnosticSeverity, IHttpContent, IHttpHeaderParam, IHttpOperation, IHttpQueryParam } from '@stoplight/types';
import * as caseless from 'caseless';

import { IHttpConfig, IHttpNameValue, IHttpNameValues, IHttpRequest, IHttpResponse } from '../types';
import { header as headerDeserializerRegistry, query as queryDeserializerRegistry } from './deserializers';
import { findOperationResponse } from './utils/spec';
import { HttpBodyValidator, HttpHeadersValidator, HttpQueryValidator, IHttpValidator } from './validators';

export class HttpValidator implements IValidator<IHttpOperation, IHttpRequest, IHttpConfig, IHttpResponse> {
  constructor(
    private readonly bodyValidator: IHttpValidator<any, IHttpContent>,
    private readonly headersValidator: IHttpValidator<IHttpNameValue, IHttpHeaderParam>,
    private readonly queryValidator: IHttpValidator<IHttpNameValues, IHttpQueryParam>,
  ) {}

  public validateInput({
    resource,
    input,
    config,
  }: {
    resource: IHttpOperation;
    input: IHttpRequest;
    config?: IHttpConfig;
  }): IPrismDiagnostic[] {
    const results: IPrismDiagnostic[] = [];
    const mediaType = caseless(input.headers || {}).get('content-type');

    // Replace resource.request in this function with request
    const { request } = resource;

    if (!config || (config && config.validateRequest)) {
      const { body } = input;
      if (request && request.body) {
        if (!body && request.body.required) {
          results.push({ code: 'required', message: 'Body parameter is required', severity: DiagnosticSeverity.Error });
        } else if (body) {
          this.bodyValidator
            .validate(body, (request && request.body && request.body.contents) || [], mediaType)
            .forEach(validationResult => results.push(validationResult));
        }
      }

      this.headersValidator
        .validate(input.headers || {}, (request && request.headers) || [], mediaType)
        .forEach(validationResult => results.push(validationResult));

      this.queryValidator
        .validate(input.url.query || {}, (request && request.query) || [], mediaType)
        .forEach(validationResult => results.push(validationResult));

      return results;
    }
    return [];
  }

  public validateOutput({
    resource,
    output,
    config,
  }: {
    resource: IHttpOperation;
    output?: IHttpResponse;
    config?: IHttpConfig;
  }): IPrismDiagnostic[] {
    if (!output) {
      return [];
    }

    if (!config || (config && config.validateResponse)) {
      const results: IPrismDiagnostic[] = [];
      const mediaType = caseless(output.headers || {}).get('content-type');
      const responseSpec = resource.responses && findOperationResponse(resource.responses, output.statusCode);

      this.bodyValidator
        .validate(output.body, (responseSpec && responseSpec.contents) || [], mediaType)
        .forEach(validationResult => results.push(validationResult));

      this.headersValidator
        .validate(output.headers || {}, (responseSpec && responseSpec.headers) || [], mediaType)
        .forEach(validationResult => results.push(validationResult));

      return results;
    }

    return [];
  }
}

export const validator = new HttpValidator(
  new HttpBodyValidator('body'),
  new HttpHeadersValidator(headerDeserializerRegistry, 'header'),
  new HttpQueryValidator(queryDeserializerRegistry, 'query'),
);
