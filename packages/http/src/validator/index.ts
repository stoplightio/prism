import { IPrismDiagnostic, ValidatorFn } from '@stoplight/prism-core';
import { DiagnosticSeverity, IHttpOperation, IHttpOperationResponse, IMediaTypeContent } from '@stoplight/types';
import * as caseless from 'caseless';

import { findFirst } from 'fp-ts/lib/Array';
import * as Either from 'fp-ts/lib/Either';
import { getSemigroup, NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import * as Option from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { inRange } from 'lodash';
import * as typeIs from 'type-is';
import { UNPROCESSABLE_ENTITY } from '../mocker/errors';
import { IHttpResponse, ProblemJsonError } from '../types';
import { header as headerDeserializerRegistry, query as queryDeserializerRegistry } from './deserializers';
import { findOperationResponse } from './utils/spec';
import { HttpBodyValidator, HttpHeadersValidator, HttpQueryValidator } from './validators';

import { sequenceT } from 'fp-ts/lib/Apply';
import { getValidation, left, map, right } from 'fp-ts/lib/Either';
import { deserialize, getMediaTypeWithContentAndSchema } from './validators/body';

// .validate in these should return Either with a semigroup
export const bodyValidator = new HttpBodyValidator('body');
export const headersValidator = new HttpHeadersValidator(headerDeserializerRegistry, 'header');
export const queryValidator = new HttpQueryValidator(queryDeserializerRegistry, 'query');

// should be put somewhere else, not under `validator/`
// for now `deserializeInput` only cares for `body`, it should also deserialize other parts of a request, which is mostly about SimpleStyleDeserializer
export const deserializeInput = (element: any, request: any) => {
  const { body } = element;
  const mediaType = caseless(element.headers || {}).get('content-type');

  // @ts-ignore
  return pipe(
    // in order to deserialize, we need to know how to do this (ie what mediaType it is):
    getMediaTypeWithContentAndSchema((request && request.contents || request.body && request.body.contents) || [], mediaType),
    Option.fold(
      () => {
        return Either.right({
          schema: '',
          body: body,
        });
      },
      // @ts-ignore
      ({ content, mediaType: mt, schema }) => {
          const needsDeserialization = !!typeIs.is(mt, ['application/x-www-form-urlencoded']);

          return pipe(
            needsDeserialization ? deserialize(content, schema, body) : Either.right(body),
            Either.map(b => {
              // the obj below should also have `query:` and `parameters:` as attributes (already deserialized)
              return {
                schema,
                body: b,
              };
            }),
            Either.mapLeft(vs => {
            return ProblemJsonError.fromTemplate(
              UNPROCESSABLE_ENTITY,
              // the message should/could be be something about failed deserialization
              'Your request body is not valid and no HTTP validation response was found in the spec, so Prism is generating this error for you.',
              {
                validation: vs.map((detail: any) => ({
                  location: ['body'].concat(detail.path as any),
                  severity: DiagnosticSeverity[detail.severity],
                  code: detail.code,
                  message: detail.message,
                })),
              },
            );
          })
          )
      }
    )
  );
};

// should also be given already deserialized `query` and `parameters`
const validateInput = ({ resource, element, schema, body }: any) => {
  const mediaType = caseless(element.headers || {}).get('content-type');
  const { request } = resource;

  const queryValidation = (element.url && element.url.query) ? Either.left(queryValidator.validate(element.url.query || {}, (request && request.query) || []) as NonEmptyArray<IPrismDiagnostic>) : Either.right([]);

  return pipe(
      sequenceT(getValidation(getSemigroup<IPrismDiagnostic>()))(
        (() =>
          !body && request.body && request.body.required
            ? left([
              { code: 'required', message: 'Body parameter is required', severity: DiagnosticSeverity.Error },
            ] as NonEmptyArray<IPrismDiagnostic>)
            : right([]))(),
        (() =>
          body
            ? bodyValidator.validate(body, (request && request.body && request.body.contents) || [], mediaType, schema)
            : right([]))(),
        element.headers ? Either.left(headersValidator.validate(element.headers || {}, (request && request.headers) || []) as NonEmptyArray<IPrismDiagnostic>) : Either.right([]),
        queryValidation,
      ),
      map(() => body),
    )
};

const validateOutput = ({ resource, element, schema, body }: any) => {
  const mediaType = caseless(element.headers || {}).get('content-type');

  return pipe(
    findOperationResponse(resource.responses, element.statusCode),
    Option.fold<IHttpOperationResponse, IPrismDiagnostic[]>(
      // @ts-ignore
      () => {
        const v = [
          {
            message: 'Unable to match the returned status code with those defined in spec',
            severity: inRange(element.statusCode, 200, 300) ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
          },
        ];

        return Either.left(v as NonEmptyArray<IPrismDiagnostic>)
      },
      (operationResponse: any) => {
        // @ts-ignore
        const mismatchingMediaTypeError = pipe(
          Option.fromNullable(operationResponse.contents),
          Option.map(contents =>
            pipe(
              contents,
              // @ts-ignore
              findFirst(c => c.mediaType === mediaType),
              Option.map<IMediaTypeContent, IPrismDiagnostic[]>(() => []),
              Option.getOrElse<IPrismDiagnostic[]>(() => [
                {
                  message: `The received media type does not match the one specified in the document`,
                  severity: DiagnosticSeverity.Error,
                },
              ]),
            ),
          ),
          Option.getOrElse<IPrismDiagnostic[]>(() => []),
        );

        return (
          pipe(
            bodyValidator.validate(body, operationResponse.contents || [], mediaType, schema),
            Either.map((r) => {
              return r.concat(mismatchingMediaTypeError)
                      .concat(headersValidator.validate(element.headers || {}, operationResponse.headers || []));
            })
          )
        )
      },
    )
  );
};

export { validateInput, validateOutput };
