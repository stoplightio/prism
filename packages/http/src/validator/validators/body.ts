import { IPrismDiagnostic } from '@stoplight/prism-core';
import { DiagnosticSeverity, Dictionary, IHttpEncoding, IMediaTypeContent } from '@stoplight/types';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import * as NEA from 'fp-ts/NonEmptyArray';
import { pipe } from 'fp-ts/function';
import { get } from 'lodash';
import * as multipart from 'parse-multipart-data';
import { is as typeIs } from 'type-is';
import { JSONSchema } from '../../types';
import { body } from '../deserializers';
import { validateAgainstSchema } from './utils';
import { NonEmptyArray } from 'fp-ts/NonEmptyArray';
import { ValidationContext, validateFn } from './types';
// @ts-ignore no typings
import * as mergeAllOf from '@stoplight/json-schema-merge-allof';

import { stripReadOnlyProperties, stripWriteOnlyProperties } from '../../utils/filterRequiredProperties';
import { JSONSchema7 } from 'json-schema';
import { wildcardMediaTypeMatch } from '../utils/wildcardMediaTypeMatch';

export function deserializeFormBody(
  schema: JSONSchema,
  encodings: IHttpEncoding[],
  decodedUriParams: Dictionary<string>
) {
  if (!schema.properties) {
    return decodedUriParams;
  }

  return pipe(
    Object.keys(schema.properties),
    A.reduce({}, (deserialized, property) => {
      deserialized[property] = decodedUriParams[property];
      const encoding = encodings.find(enc => enc.property === property);

      if (encoding && encoding.style) {
        const deserializer = body[encoding.style];
        const propertySchema = schema.properties?.[property];

        if (propertySchema && typeof propertySchema !== 'boolean')
          deserialized[property] = deserializer(property, decodedUriParams, propertySchema);
      }

      return deserialized;
    })
  );
}

export function splitUriParams(target: string) {
  return E.right(
    target.split('&').reduce((result: Dictionary<string>, pair: string) => {
      const [key, ...rest] = pair.split('=');
      result[key] = rest.join('=');
      return result;
    }, {})
  );
}

export function parseMultipartFormDataParams(
  target: string,
  multipartBoundary?: string
): E.Either<NEA.NonEmptyArray<IPrismDiagnostic>, Dictionary<string>> {
  if (!multipartBoundary) {
    const error =
      'Boundary parameter for multipart/form-data is not defined or generated in the request header. Try removing manually defined content-type from your request header if it exists.';
    return E.left<NonEmptyArray<IPrismDiagnostic>>([
      {
        message: error,
        code: 415,
        severity: DiagnosticSeverity.Error,
      },
    ]);
  }
  // the parse-multipart-data package requires that the body is passed in as a buffer, not a string
  const bufferBody = Buffer.from(target, 'utf-8');
  const parts = multipart.parse(bufferBody, multipartBoundary);

  return E.right(
    parts.reduce((result: Dictionary<string>, pair: any) => {
      result[pair['name']] = pair['data'].toString();
      return result;
    }, {})
  );
}

export function decodeUriEntities(target: Dictionary<string>) {
  return Object.entries(target).reduce((result, [k, v]) => {
    result[decodeURIComponent(k)] = decodeURIComponent(v);
    return result;
  }, {});
}

export function findContentByMediaTypeOrFirst(specs: IMediaTypeContent[], mediaType: string) {
  return pipe(
    specs,
    A.findFirst(spec => wildcardMediaTypeMatch(mediaType, spec.mediaType)),
    O.alt(() => A.head(specs)),
    O.map(content => ({ mediaType, content }))
  );
}

function deserializeAndValidate(
  content: IMediaTypeContent,
  schema: JSONSchema,
  target: string,
  context: ValidationContext,
  prefix?: string,
  multipartBoundary?: string,
  bundle?: unknown
) {
  const encodings = get(content, 'encodings', []);

  return pipe(
    content.mediaType === 'multipart/form-data'
      ? parseMultipartFormDataParams(target, multipartBoundary)
      : splitUriParams(target),
    E.chain(encodedUriParams => validateAgainstReservedCharacters(encodedUriParams, encodings, prefix)),
    E.map(decodeUriEntities),
    E.map(decodedUriEntities => deserializeFormBody(schema, encodings, decodedUriEntities)),
    E.chain(deserialised => {
      return pipe(
        validateAgainstSchema(deserialised, schema, true, context, prefix, bundle),
        E.fromOption(() => deserialised),
        E.swap
      );
    })
  );
}

/**
 * Given a schema, return an equivalent schema that does not include `allOf`.
 */
function withoutAllOf(s: JSONSchema): JSONSchema {
  try {
    return mergeAllOf(s, {
      // `deep` traverses the *whole* schema.  If this becomes a performance
      // problem, see the discussion and alternate implementation at
      // https://github.com/stoplightio/prism/pull/1957/files#r760950082
      deep: true,
      ignoreAdditionalProperties: true,
    });
  } catch {
    // BUG: If the supplied schema is impossible (e.g., contains allOf with
    // mutually exclusive children), we'll end up here.  We'd like to include an
    // IPrismDiagnostic error in the final result with the schema error, but the
    // result of this function is cached as a JSONSchema.
    return s;
  }
}

function memoizeSchemaNormalizer(normalizer: SchemaNormalizer): SchemaNormalizer {
  const cache = new WeakMap<JSONSchema7, O.Option<JSONSchema7>>();
  return (schema: JSONSchema7) => {
    const cached = cache.get(schema);
    if (!cached) {
      const after = withoutAllOf(schema);
      const newSchema = normalizer(after);
      cache.set(schema, newSchema);
      return newSchema;
    }
    return cached;
  };
}

type SchemaNormalizer = (schema: JSONSchema) => O.Option<JSONSchema>;
const normalizeSchemaProcessorMap: Record<ValidationContext, SchemaNormalizer> = {
  [ValidationContext.Input]: memoizeSchemaNormalizer(stripReadOnlyProperties),
  [ValidationContext.Output]: memoizeSchemaNormalizer(stripWriteOnlyProperties),
};

export const validate: validateFn<unknown, IMediaTypeContent> = (
  target,
  specs,
  context,
  mediaType,
  multipartBoundary,
  bundle
) => {
  const findContentByMediaType = pipe(
    O.Do,
    O.bind('mediaType', () => O.fromNullable(mediaType)),
    O.bind('contentResult', ({ mediaType }) => findContentByMediaTypeOrFirst(specs, mediaType)),
    O.alt(() => O.some({ contentResult: { content: specs[0] || {}, mediaType: 'random' } })),
    O.bind('schema', ({ contentResult }) =>
      pipe(O.fromNullable(contentResult.content.schema), O.chain(normalizeSchemaProcessorMap[context]))
    )
  );
  const prefix = 'body';

  return pipe(
    findContentByMediaType,
    O.fold(
      () => E.right(target),
      ({ contentResult: { content, mediaType: mt }, schema }) =>
        pipe(
          mt,
          O.fromPredicate(
            mediaType => !!typeIs(mediaType, ['application/x-www-form-urlencoded', 'multipart/form-data'])
          ),
          O.fold(
            () =>
              pipe(
                validateAgainstSchema(target, schema, false, context, prefix, bundle),
                E.fromOption(() => target),
                E.swap
              ),
            () =>
              pipe(
                target,
                E.fromPredicate<unknown, string, NEA.NonEmptyArray<IPrismDiagnostic>>(
                  (target: unknown): target is string => typeof target === 'string',
                  () => [{ message: 'Target is not a string', code: '422', severity: DiagnosticSeverity.Error }]
                ),
                E.chain(target => deserializeAndValidate(content, schema, target, context, prefix, multipartBoundary))
              )
          )
        )
    )
  );
};

function validateAgainstReservedCharacters(
  encodedUriParams: Dictionary<string>,
  encodings: IHttpEncoding[],
  prefix?: string
): E.Either<NEA.NonEmptyArray<IPrismDiagnostic>, Dictionary<string>> {
  return pipe(
    encodings,
    A.reduce<IHttpEncoding, IPrismDiagnostic[]>([], (diagnostics, encoding) => {
      const allowReserved = get(encoding, 'allowReserved', false);
      const property = encoding.property;
      const value = encodedUriParams[property];

      if (!allowReserved && /[/?#[\]@!$&'()*+,;=]/.test(value)) {
        diagnostics.push({
          path: prefix ? [prefix, property] : [property],
          message: 'Reserved characters used in request body',
          severity: DiagnosticSeverity.Error,
        });
      }

      return diagnostics;
    }),
    diagnostics => (A.isNonEmpty(diagnostics) ? E.left(diagnostics) : E.right(encodedUriParams))
  );
}
