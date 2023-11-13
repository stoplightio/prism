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
    return E.right(decodedUriParams);
  }

  // if the request body array contains JSON objects with multiple fields (i.e. '{"foo":"value"}, {"foo":"dd","xx":"xx"}'),
  // depending on the deserialization indicated in the encoding, it's possible we end up with an array of broken JSON
  // objects that were split on the ',' character, such as [ '{"foo":"value"}', '{"foo":"dd"', '"xx":"xx"}' ]. This function
  // processes such cases so that complete JSON objects, i.e. [ '{"foo":"value"}', '{"foo":"dd", "xx":"xx"}' ], are handled
  function parseBrokenJSONArray(inputArray: string[]) {
    let parsedJSONObjects: any[] = [];
    let currentJSONObject: string = "";

    for (let item of inputArray) {
      currentJSONObject += (currentJSONObject.length > 0 ? "," : "") + item;
      try {
        const parsed = JSON.parse(currentJSONObject);
        parsedJSONObjects.push(parsed);
        currentJSONObject = "";
      } catch (_) {}
    }

    return [parsedJSONObjects, currentJSONObject]
  }

  return pipe(
    Object.keys(schema.properties),
    (properties: string[]) => {
      const deserialized = {}
      for (let property of properties) {
        deserialized[property] = decodedUriParams[property];
        const encoding = encodings.find(enc => enc.property === property);

        if (encoding && encoding.style) {
          const deserializer = body[encoding.style];
          const propertySchema = schema.properties?.[property];

          if (propertySchema && typeof propertySchema !== 'boolean') {
            let deserializedValues = deserializer(property, decodedUriParams, propertySchema, encoding.explode)

            // As per https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.1.md#styleValues, 
            // the default deserialization standard of objects in an array of objects is JSON
            const items = propertySchema.items;
            if (Array.isArray(deserializedValues) && typeof items === "object" && items['type'] === 'object') {
              const [parsedValues, unparsedJSONString] = parseBrokenJSONArray(deserializedValues);
              if (unparsedJSONString.length > 0) {
                return E.left<NonEmptyArray<IPrismDiagnostic>>([
                  {
                    message: `Cannot deserialize JSON object array in form data request body. Make sure the array is in JSON`,
                    code: 415,
                    severity: DiagnosticSeverity.Error,
                  },
                ])
              } else {
                deserializedValues = parsedValues;
              }
            }

            deserialized[property] = deserializedValues;
          }
        }
      }

    return E.right(deserialized);
  });
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

export function decodeUriEntities(target: Dictionary<string>, mediaType: string) {
  return Object.entries(target).reduce((result, [k, v]) => {
    try {
      // In application/x-www-form-urlencoded format, the standard encoding of spaces is the plus sign "+", 
      // and plus signs in the input string are encoded as "%2B". The encoding of spaces as plus signs is 
      // unique to application/x-www-form-urlencoded. decodeURIComponent incorrectly handles decoding the plus signs. 
      // encodeURIComponent correctly encodes spaces as + (plus signs), and actual plus signs as %2B, but 
      // decodeURIComponent only decodes %2B and leaves the +'s that represent spaces encoded as +. This means 
      // the result has + signs that are indistinguishable as originally spaces or originally plus signs. Therefore, 
      // we must replace all + in the encoded string (which must all represent spaces by the standard), with %20, 
      // the non-application/x-www-form-urlencoded encoding of spaces, so that decodeURIComponent decodes them correctly
      if (typeIs(mediaType, 'application/x-www-form-urlencoded')) {
        v = v.replaceAll('+', '%20')
      }
      // NOTE: this will decode the value even if it shouldn't (i.e when text/plain mime type).
      // the decision to decode or not should be made before calling this function
      result[decodeURIComponent(k)] = decodeURIComponent(v);
    } catch (e) {
      // when the data is binary, for example, uri decoding will fail so leave value as-is
      result[decodeURIComponent(k)] = v;
    }
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
    E.map(target => decodeUriEntities(target, content.mediaType)),
    E.chain(decodedUriEntities => deserializeFormBody(schema, encodings, decodedUriEntities)),
    E.chain(deserialised => 
      pipe(
        validateAgainstSchema(deserialised, schema, true, context, prefix, bundle),
        E.fromOption(() => deserialised),
        E.swap
      )
    )
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
