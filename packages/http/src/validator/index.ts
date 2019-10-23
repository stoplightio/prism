import { IPrismDiagnostic, ValidatorFn } from '@stoplight/prism-core';
import { DiagnosticSeverity, IHttpOperation, IHttpOperationResponse } from '@stoplight/types';
import * as caseless from 'caseless';
import { findFirst } from 'fp-ts/lib/Array';
import * as Option from 'fp-ts/lib/Option';
import * as Either from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable';
import { inRange } from 'lodash';
import { IHttpRequest, IHttpResponse } from '../types';
import { header as headerDeserializerRegistry, query as queryDeserializerRegistry } from './deserializers';
import { findOperationResponse } from './utils/spec';
import { HttpBodyValidator, HttpHeadersValidator, HttpQueryValidator } from './validators';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import { sequenceValidation, sequenceOption } from './validators/utils';


export const bodyValidator = new HttpBodyValidator('body');
export const headersValidator = new HttpHeadersValidator(headerDeserializerRegistry, 'header');
export const queryValidator = new HttpQueryValidator(queryDeserializerRegistry, 'query');


const validateInput: ValidatorFn<IHttpOperation, IHttpRequest> = ({ resource, element }) => {
  const mediaType = caseless(element.headers || {}).get('content-type');
  const { request } = resource;
  const { body } = element;

  const validateBody = pipe(
    Option.fromNullable(request),
    Option.mapNullable(request => request.body),
    Option.chain(requestBody => pipe(
      requestBody,
      Option.fromPredicate(requestBody => !!requestBody.required && !body),
      Option.map<unknown, NonEmptyArray<IPrismDiagnostic>>(
        () => [{ code: 'required', message: 'Body parameter is required', severity: DiagnosticSeverity.Error }]
      ),
      Option.alt(() =>
        pipe(
          sequenceOption(Option.fromNullable(body), Option.fromNullable(requestBody.contents)),
          Option.chain(([body, contents]) =>
            pipe(
              bodyValidator.validate(body, contents, mediaType),
              Either.swap,
              Option.fromEither
            )
          )
        )
      )
    )),
    Either.fromOption(() => { }),
    Either.swap
  )

  return sequenceValidation(
    validateBody,
    headersValidator.validate(element.headers || {}, (request && request.headers) || []),
    queryValidator.validate(element.url.query || {}, (request && request.query) || [])
  )
};

const findResponseByStatus = (responses: NonEmptyArray<IHttpOperationResponse>, statusCode: number) => pipe(
  findOperationResponse(responses, statusCode),
  Either.fromOption<IPrismDiagnostic>(() => ({
    message: 'Unable to match the returned status code with those defined in spec',
    severity: inRange(statusCode, 200, 300) ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
  })),
  Either.mapLeft<IPrismDiagnostic, NonEmptyArray<IPrismDiagnostic>>(error => [error])
);

const mismatchMediaType = (response: IHttpOperationResponse, mediaType: string) => pipe(
  Option.fromNullable(response.contents),
  Option.chain(findFirst(c => c.mediaType === mediaType)),
  Either.fromOption<IPrismDiagnostic>(() => ({
    message: `The received media type does not match the one specified in the document`,
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
        mismatchMediaType(response, mediaType),
        bodyValidator.validate(element.body, response.contents || [], mediaType),
        headersValidator.validate(element.headers || {}, response.headers || []),
      )
    )
  )
};

export { validateInput, validateOutput };
