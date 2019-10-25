import { IPrismDiagnostic, ValidatorFn } from '@stoplight/prism-core';
import { DiagnosticSeverity, IHttpOperation, IHttpOperationResponse, IMediaTypeContent } from '@stoplight/types';
import * as caseless from 'caseless';
import { findFirst } from 'fp-ts/lib/Array';
import * as Option from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { inRange } from 'lodash';
// @ts-ignore
import { URI } from 'uri-template-lite';

import { IHttpRequest, IHttpResponse } from '../types';
import {
  header as headerDeserializerRegistry,
  query as queryDeserializerRegistry,
  path as pathDeserializerRegistry,
} from './deserializers';
import { findOperationResponse } from './utils/spec';
import { HttpBodyValidator, HttpHeadersValidator, HttpQueryValidator } from './validators';
import { HttpPathValidator } from './validators/path';

export const bodyValidator = new HttpBodyValidator('body');
export const headersValidator = new HttpHeadersValidator(headerDeserializerRegistry, 'header');
export const queryValidator = new HttpQueryValidator(queryDeserializerRegistry, 'query');
export const pathValidator = new HttpPathValidator(pathDeserializerRegistry, 'path');

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
    .concat(queryValidator.validate(element.url.query || {}, (request && request.query) || []))
    .concat(pathValidator.validate(getPathParams(element.url.path, resource.path), (request && request.path) || []));
};

const validateOutput: ValidatorFn<IHttpOperation, IHttpResponse> = ({ resource, element }) => {
  const mediaType = caseless(element.headers || {}).get('content-type');

  return pipe(
    findOperationResponse(resource.responses, element.statusCode),
    Option.fold<IHttpOperationResponse, IPrismDiagnostic[]>(
      () => [
        {
          message: 'Unable to match the returned status code with those defined in spec',
          severity: inRange(element.statusCode, 200, 300) ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
        },
      ],
      operationResponse => {
        const mismatchingMediaTypeError = pipe(
          Option.fromNullable(operationResponse.contents),
          Option.map(contents =>
            pipe(
              contents,
              findFirst(c => c.mediaType === mediaType),
              Option.map<IMediaTypeContent, IPrismDiagnostic[]>(() => []),
              Option.getOrElse<IPrismDiagnostic[]>(() => [
                {
                  message: `The received media type does not match the one specified in the document`,
                  severity: DiagnosticSeverity.Error,
                },
              ])
            )
          ),
          Option.getOrElse<IPrismDiagnostic[]>(() => [])
        );

        return mismatchingMediaTypeError
          .concat(bodyValidator.validate(element.body, operationResponse.contents || [], mediaType))
          .concat(headersValidator.validate(element.headers || {}, operationResponse.headers || []));
      }
    )
  );
};

function getPathParams(path: string, template: string) {
  return new URI.Template(template).match(path);
}

export { validateInput, validateOutput };
