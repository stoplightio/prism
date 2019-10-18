import { IPrismDiagnostic } from '@stoplight/prism-core';
import { DiagnosticSeverity, IMediaTypeContent } from '@stoplight/types';
import {
  HttpParamStyles,
  IHttpOperationRequest,
  IHttpOperationResponse
} from "@stoplight/types/dist";
import * as caseless from 'caseless';
import * as _ from 'lodash';
import { findFirst } from 'fp-ts/lib/Array';
import * as Either from 'fp-ts/lib/Either';
import { getSemigroup, NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import * as Option from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import * as typeIs from 'type-is';
import { IHttpRequest, IHttpResponse } from "../types";
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
import { createJsonSchemaFromParams, getPV } from "./validators/params";

export const bodyValidator = new HttpBodyValidator('body');
export const headersValidator = new HttpHeadersValidator(headerDeserializerRegistry, 'header');
export const queryValidator = new HttpQueryValidator(queryDeserializerRegistry, 'query');

function deserializeQuery(reqOrResp: IHttpOperationRequest, element: IHttpRequest) {
  const qSpec = reqOrResp.query || [];
  const qSchema = createJsonSchemaFromParams(qSpec);
  const qTarget = element.url.query || {};

  const deserializedQuery = getPV(qSpec, HttpParamStyles, queryDeserializerRegistry, qSchema, qTarget);

  return { qSchema, deserializedQuery };
}

function deserializeHeaders(reqOrResp: IHttpOperationResponse | IHttpOperationRequest, element: IHttpRequest | IHttpResponse) {
  const hSpec = reqOrResp.headers || [];
  const hSchema = createJsonSchemaFromParams(hSpec);
  const qTarget = element.headers || [];

  const deserializedHeaders = getPV(hSpec, HttpParamStyles, headerDeserializerRegistry, hSchema, qTarget);

  return { hSchema, deserializedHeaders };
}

function deserializeBody(element: IHttpRequest | IHttpResponse, content: IMediaTypeContent[]) {
  const { body } = element;
  const mediaType = caseless(element.headers || {}).get('content-type');

  return pipe(
    getMediaTypeWithContentAndSchema(content || [], mediaType),
    Option.fold(
      () => {
        return {
          bSchema: {},
          deserializedBody: '',
          content: {
            mediaType: ''
          },
          mediaType,
        }
      },
      ({ content, mediaType: mt, schema }) => {
        const needsDeserialization = !!typeIs.is(mt, ['application/x-www-form-urlencoded']);
        return pipe(
          needsDeserialization ? deserialize(content, schema, body) : body,
          b => {
            return {
              content,
              mediaType,
              bSchema: schema,
              deserializedBody: b as string
            };
          }
        )
      }
    )
  );
}

export const deserializeInput = (element: IHttpRequest, request: IHttpOperationRequest) => {
  return {
    ...deserializeBody(element, request && request.body && request.body.contents || []),
    ...deserializeHeaders(request, element),
    ...deserializeQuery(request, element)
  }
};

export const deserializeOutput = (element: IHttpResponse, response: IHttpOperationResponse) => {
  return {
    ...deserializeBody(element, response && response.contents || []),
    ...deserializeHeaders(response, element),
  }
};

const validateFormUrlencoded = (element: IHttpRequest, mediaType: string, c: IMediaTypeContent) => {
  if (typeof element.body === "string") {
    const encodedUriParams = splitUriParams(element.body);
    const encodings = _.get(c, 'encodings', []);

    return validateAgainstReservedCharacters(encodedUriParams, encodings)
  } else {
    return Either.right([]);
  }
};

// yeah, the DTO could have a bit different structure that's for sure
const validateInput = ({ resource, element, bSchema, deserializedBody, hSchema, qSchema, deserializedHeaders, deserializedQuery, content, mediaType }: any) => {
  const { request } = resource;

  const queryValidation = queryValidator.validate(element.url.query || {}, (request && request.query) || [], deserializedQuery, qSchema);

  const reqBodyValidation = !deserializedBody && request.body && request.body.required ? left([
      { code: 'required', message: 'Body parameter is required', severity: DiagnosticSeverity.Error },
    ] as NonEmptyArray<IPrismDiagnostic>)
    : right([]);

  const bodyValidation = deserializedBody ? bodyValidator.validate(deserializedBody, (request && request.body && request.body.contents) || [], mediaType, bSchema)
    : right([]);

  const headersValidation = headersValidator.validate(element.headers || {}, (request && request.headers) || [], deserializedHeaders, hSchema);

  return pipe(
    sequenceT(getValidation(getSemigroup<IPrismDiagnostic>()))(
      reqBodyValidation,
      bodyValidation,
      headersValidation,
      queryValidation,
      validateFormUrlencoded(element, mediaType, content)
    ),
    map(() => []),
  );
};

function getMismatchingMediaTypeErr(c: IMediaTypeContent[], mediaType: string) {
  return pipe(
    Option.fromNullable(c),
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

const validateOutput = ({ element, bSchema, deserializedBody, hSchema, deserializedHeaders, resp }: any) => {
  const mediaType = caseless(element.headers || {}).get('content-type');

  const mismatchingMediaTypeError = getMismatchingMediaTypeErr(resp.contents, mediaType);
  const headersValidation = headersValidator.validate(element.headers || {}, resp.headers || [], deserializedHeaders, hSchema);
  const bodyValidation = bodyValidator.validate(deserializedBody, resp.contents || [], mediaType, bSchema);

  return pipe(
    sequenceT(getValidation(getSemigroup<IPrismDiagnostic>()))(
      bodyValidation,
      mismatchingMediaTypeError,
      headersValidation
    ),
    map(() => []),
  );
};

export { validateInput, validateOutput, findOperationResponse };
