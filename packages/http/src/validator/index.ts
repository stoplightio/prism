import { IPrismDiagnostic, ValidatorFn } from '@stoplight/prism-core';
import {
  DiagnosticSeverity,
  IHttpOperation,
  IHttpOperationResponse,
  IHttpOperationRequest,
  IMediaTypeContent,
  IHttpOperationRequestBody,
} from '@stoplight/types';
import * as caseless from 'caseless';
import { findFirst, isNonEmpty } from 'fp-ts/lib/Array';
import * as Option from 'fp-ts/lib/Option';
import * as Either from 'fp-ts/lib/Either';
import * as typeIs from 'type-is';
import { pipe } from 'fp-ts/lib/pipeable';
import { inRange } from 'lodash';
import { validateSecurity } from './validators/security';
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
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import { sequenceValidation, sequenceOption } from './validators/utils';
import { HttpPathValidator } from './validators/path';

export const bodyValidator = new HttpBodyValidator('body');
export const headersValidator = new HttpHeadersValidator(headerDeserializerRegistry, 'header');
export const queryValidator = new HttpQueryValidator(queryDeserializerRegistry, 'query');
export const pathValidator = new HttpPathValidator(pathDeserializerRegistry, 'path');

const checkBodyIsProvided = (requestBody: IHttpOperationRequestBody, body: unknown) =>
  pipe(
    requestBody,
    Either.fromPredicate<NonEmptyArray<IPrismDiagnostic>, IHttpOperationRequestBody>(
      requestBody => !(!!requestBody.required && !body),
      () => [{ code: 'required', message: 'Body parameter is required', severity: DiagnosticSeverity.Error }]
    )
  );

const validateIfBodySpecIsProvided = (body: unknown, mediaType: string, contents?: IMediaTypeContent[]) =>
  pipe(
    sequenceOption(Option.fromNullable(body), Option.fromNullable(contents)),
    Option.fold(
      () => Either.right(body),
      ([body, contents]) => bodyValidator.validate(body, contents, mediaType)
    )
  );

const validateBody = (requestBody: IHttpOperationRequestBody, body: unknown, mediaType: string) =>
  pipe(
    checkBodyIsProvided(requestBody, body),
    Either.chain(() => validateIfBodySpecIsProvided(body, mediaType, requestBody.contents))
  );

const validateInput: ValidatorFn<IHttpOperation, IHttpRequest> = ({ resource, element }) => {
  const mediaType = caseless(element.headers || {}).get('content-type');
  const { request } = resource;
  const { body } = element;

  return pipe(
    Either.fromNullable(undefined)(request),
    Either.fold(
      e => Either.right<NonEmptyArray<IPrismDiagnostic>, unknown>(e),
      request =>
        sequenceValidation(
          request.body ? validateBody(request.body, body, mediaType) : Either.right(undefined),
          request.headers ? headersValidator.validate(element.headers || {}, request.headers) : Either.right(undefined),
          request.query ? queryValidator.validate(element.url.query || {}, request.query) : Either.right(undefined),
          request.path
            ? pathValidator.validate(getPathParams(element.url.path, resource.path), request.path)
            : Either.right(undefined)
        )
    ),
    Either.map(() => element)
  );
};

const findResponseByStatus = (responses: NonEmptyArray<IHttpOperationResponse>, statusCode: number) =>
  pipe(
    findOperationResponse(responses, statusCode),
    Either.fromOption<IPrismDiagnostic>(() => ({
      message: `Unable to match the returned status code with those defined in the document: ${responses
        .map(response => response.code)
        .join(',')}`,
      severity: inRange(statusCode, 200, 300) ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
    })),
    Either.mapLeft<IPrismDiagnostic, NonEmptyArray<IPrismDiagnostic>>(error => [error])
  );

const validateMediaType = (contents: NonEmptyArray<IMediaTypeContent>, mediaType: string) =>
  pipe(
    contents,
    findFirst(c => !!typeIs.is(mediaType, [c.mediaType])),
    Either.fromOption<IPrismDiagnostic>(() => ({
      message: `The received media type "${mediaType || ''}" does not match the one${
        contents.length > 1 ? 's' : ''
      } specified in the current response: ${contents.map(c => c.mediaType).join(', ')}`,
      severity: DiagnosticSeverity.Error,
    })),
    Either.mapLeft<IPrismDiagnostic, NonEmptyArray<IPrismDiagnostic>>(e => [e])
  );

const validateOutput: ValidatorFn<IHttpOperation, IHttpResponse> = ({ resource, element }) => {
  const mediaType = caseless(element.headers || {}).get('content-type');
  return pipe(
    findResponseByStatus(resource.responses, element.statusCode),
    Either.chain(response =>
      sequenceValidation(
        pipe(
          Option.fromNullable(response.contents),
          Option.chain(contents => pipe(contents, Option.fromPredicate(isNonEmpty))),
          Option.fold(
            () => Either.right<NonEmptyArray<IPrismDiagnostic>, unknown>(undefined),
            contents => validateMediaType(contents, mediaType)
          )
        ),
        bodyValidator.validate(element.body, response.contents || [], mediaType),
        headersValidator.validate(element.headers || {}, response.headers || [])
      )
    ),
    Either.map(() => element)
  );
};

function getPathParams(path: string, template: string) {
  return new URI.Template(template).match(path);
}

export { validateInput, validateOutput, validateSecurity };
