import { IPrismDiagnostic, ValidatorFn } from '@stoplight/prism-core';
import { DiagnosticSeverity, IHttpOperation, IHttpOperationResponse, IMediaTypeContent } from '@stoplight/types';
import {HttpParamStyles} from "@stoplight/types/dist";
import * as caseless from 'caseless';
import * as _ from 'lodash';
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
import {
  deserialize,
  getMediaTypeWithContentAndSchema,
  splitUriParams,
  validateAgainstReservedCharacters
} from './validators/body';
import {createJsonSchemaFromParams, getPV} from "./validators/params";

// .validate in these should return Either with a semigroup
export const bodyValidator = new HttpBodyValidator('body');
export const headersValidator = new HttpHeadersValidator(headerDeserializerRegistry, 'header');
export const queryValidator = new HttpQueryValidator(queryDeserializerRegistry, 'query');

// deserializeHeaders is almost identical, do not worry for now
function deserializeQuery(request: any, element: any) {
  const qSpec = _.get(request, 'query', []);
  const qSchema = createJsonSchemaFromParams(qSpec);
  const qTarget = _.get(element, ['url', 'query'], {});

  const deserializedQuery = getPV(qSpec, HttpParamStyles, queryDeserializerRegistry, qSchema, qTarget);

  return { deserializedQuery, qSchema };
}

function deserializeHeaders(request: any, element: any) {
  const hSpec = _.get(request, 'headers', []);
  const hSchema = createJsonSchemaFromParams(hSpec);
  const qTarget = element.headers || [];

  const deserializedHeaders = getPV(hSpec, HttpParamStyles, headerDeserializerRegistry, hSchema, qTarget);

  return { hSchema, deserializedHeaders };
}

function deserializeBody(request: any, element: any, x : any) {
  const { body } = element;
  const mediaType = caseless(element.headers || {}).get('content-type');

  return pipe(
    // in order to deserialize, we need to know how to do this (ie what mediaType it is):
    // maybe return this somehow? input funcs might need it
    getMediaTypeWithContentAndSchema(x || [], mediaType),
    Option.fold(
      // rethink this
      () => {
        return {
          schema: '',
          body: ''
        }
      },
      // @ts-ignore
      ({ content, mediaType: mt, schema }) => {
        const needsDeserialization = !!typeIs.is(mt, ['application/x-www-form-urlencoded']);
        return pipe(
          needsDeserialization ? deserialize(content, schema, body) : body,
          b => {
            return {
              schema,
              body: b
            };
          }
        )
      }
    )
  );
}

export const deserializeInput = (element: any, request: any) => {
  return Either.right({
      ...deserializeBody(request, element, request && request.body && request.body.contents),
      ...deserializeHeaders(request, element),
      ...deserializeQuery(request, element)
    })
};

export const deserializeOutput = (element: any, request: any) => {
  return Either.right({
      ...deserializeBody(request, element, request && request.contents),
      ...deserializeHeaders(request, element),
    })
};

const validateFormUrlencoded = (request: any, element: any, mediaType: any) => {
  return pipe(
    getMediaTypeWithContentAndSchema((request && request.contents || request.body && request.body.contents) || [], mediaType),
    Option.fold(
      () => {
        return [];
      },
      // @ts-ignore
      ({ content }) => {
        const encodedUriParams = splitUriParams(element.body);
        const encodings = _.get(content, 'encodings', []);

        return validateAgainstReservedCharacters(encodedUriParams, encodings)
      }
    )
  )
};

// schema - bodySchema
const validateInput = ({ resource, element, schema, body, hSchema, qSchema, deserializedHeaders, deserializedQuery }: any) => {
  const mediaType = caseless(element.headers || {}).get('content-type');
  const { request } = resource;

  const queryValidation = queryValidator.validate(element.url.query || {}, (request && request.query) || [], deserializedQuery, qSchema)

  const reqBodyValidation = !body && request.body && request.body.required ? left([
      {code: 'required', message: 'Body parameter is required', severity: DiagnosticSeverity.Error},
    ] as NonEmptyArray<IPrismDiagnostic>)
    : right([]);

  const bodyValidation = body ? bodyValidator.validate(body, (request && request.body && request.body.contents) || [], mediaType, schema)
    : right([]);

  const headersValidation = headersValidator.validate(element.headers || {}, (request && request.headers) || [], deserializedHeaders, hSchema)

  const violations = pipe(
    sequenceT(getValidation(getSemigroup<IPrismDiagnostic>()))(
      // @ts-ignore
      reqBodyValidation,
      bodyValidation,
      headersValidation,
      queryValidation,
      body && typeof element.body === "string" ?  validateFormUrlencoded(request, element, mediaType) : Either.right([])
    ),
    map(() => []),
  );

  console.log('violations', violations);

  return violations;
};

function getMismatchingMediaTypeErr(c: any, mediaType: any) {
  return pipe(
    Option.fromNullable(c),
    Option.map(contents =>
      pipe(
        contents,
        // @ts-ignore
        findFirst(c => c.mediaType === mediaType),
        (abc: any) => {
          return abc;
        },
        Option.map<IMediaTypeContent, IPrismDiagnostic[]>(() => []),
        Option.getOrElse<IPrismDiagnostic[]>(() => [
          {
            message: `The received media type does not match the one specified in the document`,
            severity: DiagnosticSeverity.Error,
          },
        ]),
      ),
    ),
    Option.fold(
      () => {
        return Either.right([]);
      },
      (mismatchingMediaTypeError) => {
         return mismatchingMediaTypeError.length ? Either.left(mismatchingMediaTypeError as NonEmptyArray<IPrismDiagnostic>) : Either.right([]);
      }
    )
  );
}

const validateOutput = ({resource, element, schema, body, hSchema, deserializedHeaders }: any) => {
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
        const mismatchingMediaTypeError = getMismatchingMediaTypeErr(operationResponse.contents, mediaType);
        const headersValidation = headersValidator.validate(element.headers || {}, operationResponse.headers || [], deserializedHeaders, hSchema);
        const bodyValidation = bodyValidator.validate(body, operationResponse.contents || [], mediaType, schema);

        return pipe(
          sequenceT(getValidation(getSemigroup<IPrismDiagnostic>()))(
            bodyValidation,
            mismatchingMediaTypeError,
            headersValidation
          ),
          map(() => []),
        );
      },
    )
  );
};

export {validateInput, validateOutput};
