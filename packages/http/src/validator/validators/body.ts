import { IPrismDiagnostic } from '@stoplight/prism-core';
import { DiagnosticSeverity, Dictionary, IHttpEncoding, IMediaTypeContent } from '@stoplight/types';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import * as NEA from 'fp-ts/NonEmptyArray';
import { pipe } from 'fp-ts/function';
import { get } from 'lodash';
import { is as typeIs } from 'type-is';
import { JSONSchema } from '../../types';
import { body } from '../deserializers';
import { validateAgainstSchema } from './utils';
import { ValidationContext, validateFn } from './types';

import { stripReadOnlyProperties, stripWriteOnlyProperties } from '../../utils/filterRequiredProperties';

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
  return target.split('&').reduce((result: Dictionary<string>, pair: string) => {
    const [key, ...rest] = pair.split('=');
    result[key] = rest.join('=');
    return result;
  }, {});
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
    A.findFirst(spec => !!typeIs(mediaType, [spec.mediaType])),
    O.alt(() => A.head(specs)),
    O.map(content => ({ mediaType, content }))
  );
}

function deserializeAndValidate(content: IMediaTypeContent, schema: JSONSchema, target: string, bundle?: unknown) {
  const encodings = get(content, 'encodings', []);
  const encodedUriParams = splitUriParams(target);

  return pipe(
    validateAgainstReservedCharacters(encodedUriParams, encodings),
    E.map(decodeUriEntities),
    E.map(decodedUriEntities => deserializeFormBody(schema, encodings, decodedUriEntities)),
    E.chain(deserialised =>
      pipe(
        validateAgainstSchema(deserialised, schema, true, undefined, bundle),
        E.fromOption(() => deserialised),
        E.swap
      )
    )
  );
}

const normalizeSchemaProcessorMap: Record<ValidationContext, (schema: JSONSchema) => O.Option<JSONSchema>> = {
  [ValidationContext.Input]: stripReadOnlyProperties,
  [ValidationContext.Output]: stripWriteOnlyProperties,
};

export const validate: validateFn<unknown, IMediaTypeContent> = (target, specs, context, mediaType, bundle) => {
  const findContentByMediaType = pipe(
    O.Do,
    O.bind('mediaType', () => O.fromNullable(mediaType)),
    O.bind('contentResult', ({ mediaType }) => findContentByMediaTypeOrFirst(specs, mediaType)),
    O.alt(() => O.some({ contentResult: { content: specs[0] || {}, mediaType: 'random' } })),
    O.bind('schema', ({ contentResult }) =>
      pipe(O.fromNullable(contentResult.content.schema), O.chain(normalizeSchemaProcessorMap[context]))
    )
  );

  return pipe(
    findContentByMediaType,
    O.fold(
      () => E.right(target),
      ({ contentResult: { content, mediaType: mt }, schema }) =>
        pipe(
          mt,
          O.fromPredicate(mediaType => !!typeIs(mediaType, ['application/x-www-form-urlencoded'])),
          O.fold(
            () =>
              pipe(
                validateAgainstSchema(target, schema, false, undefined, bundle),
                E.fromOption(() => target),
                E.swap
              ),
            () =>
              pipe(
                target,
                E.fromPredicate<NEA.NonEmptyArray<IPrismDiagnostic>, unknown, string>(
                  (target: unknown): target is string => typeof target === 'string',
                  () => [{ message: 'Target is not a string', code: '422', severity: DiagnosticSeverity.Error }]
                ),
                E.chain(target => deserializeAndValidate(content, schema, target))
              )
          ),
          E.mapLeft(diagnostics => applyPrefix('body', diagnostics))
        )
    )
  );
};

function applyPrefix(
  prefix: string,
  diagnostics: NEA.NonEmptyArray<IPrismDiagnostic>
): NEA.NonEmptyArray<IPrismDiagnostic> {
  return pipe(
    diagnostics,
    NEA.map(d => ({ ...d, path: [prefix, ...(d.path || [])] }))
  );
}

function validateAgainstReservedCharacters(
  encodedUriParams: Dictionary<string>,
  encodings: IHttpEncoding[]
): E.Either<NEA.NonEmptyArray<IPrismDiagnostic>, Dictionary<string>> {
  return pipe(
    encodings,
    A.reduce<IHttpEncoding, IPrismDiagnostic[]>([], (diagnostics, encoding) => {
      const allowReserved = get(encoding, 'allowReserved', false);
      const property = encoding.property;
      const value = encodedUriParams[property];

      if (!allowReserved && /[/?#[\]@!$&'()*+,;=]/.test(value)) {
        diagnostics.push({
          path: [property],
          message: 'Reserved characters used in request body',
          severity: DiagnosticSeverity.Error,
        });
      }

      return diagnostics;
    }),
    diagnostics => (A.isNonEmpty(diagnostics) ? E.left(diagnostics) : E.right(encodedUriParams))
  );
}
