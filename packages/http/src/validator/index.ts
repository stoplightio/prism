import { IPrismDiagnostic, ValidatorFn } from '@stoplight/prism-core';
import {
  DiagnosticSeverity,
  IHttpOperation,
  IHttpOperationResponse,
  IMediaTypeContent,
  IHttpOperationRequestBody,
  Dictionary,
} from '@stoplight/types';
import * as caseless from 'caseless';
import * as contentType from 'content-type';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import { sequenceValidation, sequenceOption } from '../combinators';
import { is as typeIs } from 'type-is';
import { pipe } from 'fp-ts/function';
import { inRange, isMatch } from 'lodash';
import { URI } from 'uri-template-lite';
export { validateSecurity } from './validators/security';

import { IHttpRequest, IHttpResponse } from '../types';
import { findOperationResponse } from './utils/spec';
import { validateBody, validateHeaders, validateQuery, validatePath } from './validators';
import { NonEmptyArray } from 'fp-ts/NonEmptyArray';

const checkBodyIsProvided = (requestBody: IHttpOperationRequestBody, body: unknown) =>
  pipe(
    requestBody,
    E.fromPredicate<NonEmptyArray<IPrismDiagnostic>, IHttpOperationRequestBody>(
      requestBody => !(!!requestBody.required && !body),
      () => [{ code: 'required', message: 'Body parameter is required', severity: DiagnosticSeverity.Error }]
    )
  );

const validateIfBodySpecIsProvided = (
  body: unknown,
  mediaType: string,
  contents?: IMediaTypeContent[],
  bundle?: unknown
) =>
  pipe(
    sequenceOption(O.fromNullable(body), O.fromNullable(contents)),
    O.fold(
      () => E.right(body),
      ([body, contents]) => validateBody(body, contents, mediaType, bundle)
    )
  );

const tryValidateBody = (requestBody: IHttpOperationRequestBody, bundle: unknown, body: unknown, mediaType: string) =>
  pipe(
    checkBodyIsProvided(requestBody, body),
    E.chain(() => validateIfBodySpecIsProvided(body, mediaType, requestBody.contents, bundle))
  );

export const validateInput: ValidatorFn<IHttpOperation, IHttpRequest> = ({ resource, element }) => {
  const mediaType = caseless(element.headers || {}).get('content-type');
  const { request } = resource;
  const { body } = element;

  const bundle = resource['__bundled__'];
  return pipe(
    E.fromNullable(undefined)(request),
    E.fold(
      e => E.right<NonEmptyArray<IPrismDiagnostic>, unknown>(e),
      request =>
        sequenceValidation(
          request.body ? tryValidateBody(request.body, bundle, body, mediaType) : E.right(undefined),
          request.headers ? validateHeaders(element.headers || {}, request.headers, bundle) : E.right(undefined),
          request.query ? validateQuery(element.url.query || {}, request.query, bundle) : E.right(undefined),
          request.path
            ? validatePath(getPathParams(element.url.path, resource.path), request.path, bundle)
            : E.right(undefined)
        )
    ),
    E.map(() => element)
  );
};

const findResponseByStatus = (responses: IHttpOperationResponse[], statusCode: number) =>
  pipe(
    findOperationResponse(responses, statusCode),
    E.fromOption<IPrismDiagnostic>(() => ({
      message: `Unable to match the returned status code with those defined in the document: ${responses
        .map(response => response.code)
        .join(',')}`,
      severity: inRange(statusCode, 200, 300) ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
    })),
    E.mapLeft<IPrismDiagnostic, NonEmptyArray<IPrismDiagnostic>>(error => [error])
  );

export const validateMediaType = (contents: NonEmptyArray<IMediaTypeContent>, mediaType: string) =>
  pipe(
    O.fromNullable(mediaType),
    O.map(contentType.parse),
    O.chain(parsedMediaType =>
      pipe(
        contents,
        A.findFirst(c => {
          const parsedSelectedContentMediaType = contentType.parse(c.mediaType);
          return (
            !!typeIs(parsedMediaType.type, [parsedSelectedContentMediaType.type]) &&
            isMatch(parsedMediaType.parameters, parsedSelectedContentMediaType.parameters)
          );
        })
      )
    ),
    E.fromOption<IPrismDiagnostic>(() => ({
      message: `The received media type "${mediaType || ''}" does not match the one${
        contents.length > 1 ? 's' : ''
      } specified in the current response: ${contents.map(c => c.mediaType).join(', ')}`,
      severity: DiagnosticSeverity.Error,
    })),
    E.mapLeft<IPrismDiagnostic, NonEmptyArray<IPrismDiagnostic>>(e => [e])
  );

export const validateOutput: ValidatorFn<IHttpOperation, IHttpResponse> = ({ resource, element }) => {
  const mediaType = caseless(element.headers || {}).get('content-type');
  const bundle = resource['__bundled__'];
  return pipe(
    findResponseByStatus(resource.responses, element.statusCode),
    E.chain(response =>
      sequenceValidation(
        pipe(
          O.fromNullable(response.contents),
          O.chain(contents => pipe(contents, O.fromPredicate(A.isNonEmpty))),
          O.fold(
            () => E.right<NonEmptyArray<IPrismDiagnostic>, unknown>(undefined),
            contents => validateMediaType(contents, mediaType)
          )
        ),
        validateBody(element.body, response.contents || [], mediaType, bundle),
        validateHeaders(element.headers || {}, response.headers || [], bundle)
      )
    ),
    E.map(() => element)
  );
};

function getPathParams(path: string, template: string): Dictionary<string> {
  return new URI.Template(template).match(path);
}
