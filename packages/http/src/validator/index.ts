import { IPrismComponents, IPrismDiagnostic, ValidatorFn } from '@stoplight/prism-core';
import { DiagnosticSeverity, IHttpOperation } from '@stoplight/types';
import * as caseless from 'caseless';

import { IHttpConfig, IHttpRequest, IHttpResponse } from '../types';
import { header as headerDeserializerRegistry, query as queryDeserializerRegistry } from './deserializers';
import { findOperationResponse } from './utils/spec';
import { HttpBodyValidator, HttpHeadersValidator, HttpQueryValidator } from './validators';

export const bodyValidator = new HttpBodyValidator('body');
export const headersValidator = new HttpHeadersValidator(headerDeserializerRegistry, 'header');
export const queryValidator = new HttpQueryValidator(queryDeserializerRegistry, 'query');

const validateInput: ValidatorFn<IHttpOperation, IHttpRequest> = ({ resource, element }) => {
  const results: IPrismDiagnostic[] = [];
  const mediaType = caseless(element.headers || {}).get('content-type');

  // Replace resource.request in this function with request
  const { request } = resource;

  const { body } = element;
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
    .validate(element.headers || {}, (request && request.headers) || [])
    .forEach(validationResult => results.push(validationResult));

  queryValidator
    .validate(element.url.query || {}, (request && request.query) || [])
    .forEach(validationResult => results.push(validationResult));

  return results;
};

const validateOutput: ValidatorFn<IHttpOperation, IHttpResponse> = ({ resource, element }) => {
  const results: IPrismDiagnostic[] = [];
  const mediaType = caseless(element.headers || {}).get('content-type');
  const responseSpec = resource.responses && findOperationResponse(resource.responses, element.statusCode);

  bodyValidator
    .validate(element.body, (responseSpec && responseSpec.contents) || [], mediaType)
    .forEach(validationResult => results.push(validationResult));

  headersValidator
    .validate(element.headers || {}, (responseSpec && responseSpec.headers) || [])
    .forEach(validationResult => results.push(validationResult));

  return results;
};

export { validateInput, validateOutput };
