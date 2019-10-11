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

  if (!body) {
    return Either.right({
      schema: [],
      body: ''
    })
  }

  return pipe(
    // in order to deserialize, we need to know how to do this (ie what mediaType it is):
    getMediaTypeWithContentAndSchema((request && request.body && request.body.contents) || [], mediaType),
    Either.fromOption(() => {
      // so it means that there was nothing to deserialize
      // this is still wrong as this is a left
      return [];
    }),
    Either.chain(({ content, mediaType: mt, schema }) => {
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
      );
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
    }),
  );
};

// should also be given already deserialized `query` and `parameters`
const validateInput = ({ resource, element, schema, body }: any) => {
  const mediaType = caseless(element.headers || {}).get('content-type');
  const { request } = resource;

  if (request && request.body) {
    return pipe(
      sequenceT(getValidation(getSemigroup<IPrismDiagnostic>()))(
        (() =>
          !body && request.body.required
            ? left([
                { code: 'required', message: 'Body parameter is required', severity: DiagnosticSeverity.Error },
              ] as NonEmptyArray<IPrismDiagnostic>)
            : right([]))(),
        (() =>
          body
            ? bodyValidator.validate(body, (request && request.body && request.body.contents) || [], mediaType, schema)
            : right([]))(),
        // example validation result: left([{ message: 'some other validation', severity: 0 }] as NonEmptyArray<IPrismDiagnostic>),
        // headersValidator.validate and queryValidator.validate should be part of the sequence, they were not included so that the poc could be minimal
        Either.left(headersValidator.validate(element.headers || {}, (request && request.headers) || []) as NonEmptyArray<IPrismDiagnostic>), // just for now
        Either.left(queryValidator.validate(element.url.query || {}, (request && request.query) || []) as NonEmptyArray<IPrismDiagnostic>), // just for now
      ),
      map(() => body),
    );
  } else {
    return right([]);
  }
};

// should take `schema` and `body` from factory.ts like `validateInput` is doing
const validateOutput = ({ resource, element }: any) => {
  const mediaType = caseless(element.headers || {}).get('content-type');

  const u = pipe(
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
              ]),
            ),
          ),
          Option.getOrElse<IPrismDiagnostic[]>(() => []),
        );



        return (
          mismatchingMediaTypeError
            // .concat(bodyValidator.validate(element.body, operationResponse.contents || [], mediaType))
            // ^ was commented out for the simplicity sake, `bodyValidator.validate` is now returning Either with a semigroup as its left value
            // ^ `element.body` will be passes as `body`, which is, if that was needed, deserialised
            .concat(headersValidator.validate(element.headers || {}, operationResponse.headers || []))
        );
      },
    )
  );

  if (u.length) {

    return Either.left(u);

    // take a look down below
    // return pipe(
    //     bodyValidator.validate(element.body, /*operationResponse.contents ||*/ [], mediaType),
    //     Either.mapLeft((x) => {
    //       return x.concat(u)
    //     })
    //   )
  } else {
    return Either.right([]);
  }
};

export { validateInput, validateOutput };
