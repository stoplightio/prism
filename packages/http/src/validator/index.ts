import { IPrismDiagnostic, ValidatorFn } from '@stoplight/prism-core';
import { DiagnosticSeverity, IHttpOperation, IHttpOperationResponse } from '@stoplight/types';
import * as caseless from 'caseless';

import { fold } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { IHttpRequest, IHttpResponse } from '../types';
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

  return results
    .concat(headersValidator.validate(element.headers || {}, (request && request.headers) || []))
    .concat(queryValidator.validate(element.url.query || {}, (request && request.query) || []));
};

const validateOutput: ValidatorFn<IHttpOperation, IHttpResponse> = ({ resource, element }) => {
  const mediaType = caseless(element.headers || {}).get('content-type');

  return pipe(
    findOperationResponse(resource.responses, element.statusCode),
    fold<IHttpOperationResponse, IPrismDiagnostic[]>(
      () => [
        {
          message: 'Unable to match returned status code with those defined in spec',
          severity:
            element.statusCode >= 200 && element.statusCode <= 299
              ? DiagnosticSeverity.Error
              : DiagnosticSeverity.Warning,
        },
      ],
      operationResponse =>
        bodyValidator
          .validate(element.body, operationResponse.contents || [], mediaType)
          .concat(headersValidator.validate(element.headers || {}, operationResponse.headers || [])),
    ),
  );
};

export { validateInput, validateOutput };
