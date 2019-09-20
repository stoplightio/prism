import { IPrismComponents, IPrismDiagnostic } from '@stoplight/prism-core';
import { DiagnosticSeverity, IHttpOperation } from '@stoplight/types';
import * as caseless from 'caseless';

import { IHttpConfig, IHttpRequest, IHttpResponse } from '../types';
import { header as headerDeserializerRegistry, query as queryDeserializerRegistry } from './deserializers';
import { findOperationResponse } from './utils/spec';
import { HttpBodyValidator, HttpHeadersValidator, HttpQueryValidator } from './validators';

export const bodyValidator = new HttpBodyValidator('body');
export const headersValidator = new HttpHeadersValidator(headerDeserializerRegistry, 'header');
export const queryValidator = new HttpQueryValidator(queryDeserializerRegistry, 'query');

const validateInput: NonNullable<
  IPrismComponents<IHttpOperation, IHttpRequest, unknown, IHttpConfig>['validateInput']
> = ({ resource, input }) => {
  const results: IPrismDiagnostic[] = [];
  const mediaType = caseless(input.headers || {}).get('content-type');

  // Replace resource.request in this function with request
  const { request } = resource;

  const { body } = input;
  if (request && request.body) {
    if (!body && request.body.required) {
      results.push({ code: 'required', message: 'Body parameter is required', severity: DiagnosticSeverity.Error });
    } else if (body) {
      bodyValidator
        .validate(body, (request && request.body && request.body.contents) || [], mediaType)
        .forEach(validationResult => results.push(validationResult));
    }
  }

  headersValidator
    .validate(input.headers || {}, (request && request.headers) || [])
    .forEach(validationResult => results.push(validationResult));

  queryValidator
    .validate(input.url.query || {}, (request && request.query) || [])
    .forEach(validationResult => results.push(validationResult));

  return results;
};

const validateOutput: NonNullable<
  IPrismComponents<IHttpOperation, unknown, IHttpResponse, IHttpConfig>['validateOutput']
> = ({ resource, output }) => {
  const results: IPrismDiagnostic[] = [];
  const mediaType = caseless(output.headers || {}).get('content-type');
  const responseSpec = resource.responses && findOperationResponse(resource.responses, output.statusCode);

  bodyValidator
    .validate(output.body, (responseSpec && responseSpec.contents) || [], mediaType)
    .forEach(validationResult => results.push(validationResult));

  headersValidator
    .validate(output.headers || {}, (responseSpec && responseSpec.headers) || [])
    .forEach(validationResult => results.push(validationResult));

  return results;
};

export { validateInput, validateOutput };
