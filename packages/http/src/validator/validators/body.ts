import { IPrismDiagnostic } from '@stoplight/prism-core';
import { DiagnosticSeverity, Dictionary, IHttpEncoding, IMediaTypeContent } from '@stoplight/types';
import * as Array from 'fp-ts/lib/Array';
import * as E from 'fp-ts/lib/Either';
import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { get } from 'lodash';
import { JSONSchema } from '../../types';
import { body } from '../deserializers';
import { IHttpValidator } from './types';
import { validateAgainstSchema } from './utils';
import { is } from 'type-is';
import * as NonEmptyArray from 'fp-ts/lib/NonEmptyArray';

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
    Array.reduce({}, (deserialized, property) => {
      deserialized[property] = decodedUriParams[property];
      const encoding = encodings.find(enc => enc.property === property);

      if (encoding && encoding.style) {
        const deserializer = body.get(encoding.style);
        if (deserializer && schema.properties) {
          const propertySchema = schema.properties[property];
          deserialized[property] = deserializer.deserialize(property, decodedUriParams, propertySchema as JSONSchema);
        }
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
    Array.findFirst(spec => !!is(mediaType, [spec.mediaType])),
    O.alt(() => Array.head(specs)),
    O.map(content => ({ mediaType, content }))
  );
}

function deserializeAndValidate(content: IMediaTypeContent, schema: JSONSchema, target: string) {
  const encodings = get(content, 'encodings', []);
  const encodedUriParams = splitUriParams(target);

  return pipe(
    validateAgainstReservedCharacters(encodedUriParams, encodings),
    E.map(decodeUriEntities),
    E.map(decodedUriEntities => deserializeFormBody(schema, encodings, decodedUriEntities)),
    E.chain(deserialised =>
      pipe(
        validateAgainstSchema(deserialised, schema, true),
        E.fromOption(() => deserialised),
        E.swap
      )
    )
  );
}

export class HttpBodyValidator implements IHttpValidator<any, IMediaTypeContent> {
  constructor(private prefix: string) {}

  public validate(target: unknown, specs: IMediaTypeContent[], mediaType?: string) {
    const findContentByMediaType = pipe(
      O.fromNullable(mediaType),
      O.chain(mt => findContentByMediaTypeOrFirst(specs, mt)),
      O.alt(() => O.some({ content: specs[0] || {}, mediaType: 'random' })),
      O.chain(({ mediaType, content }) =>
        pipe(
          O.fromNullable(content.schema),
          O.map(schema => ({ schema, mediaType, content }))
        )
      )
    );

    return pipe(
      findContentByMediaType,
      O.fold(
        () => E.right(target),
        ({ content, mediaType: mt, schema }) =>
          pipe(
            mt,
            O.fromPredicate(mediaType => !!is(mediaType, ['application/x-www-form-urlencoded'])),
            O.fold(
              () =>
                pipe(
                  validateAgainstSchema(target, schema, false),
                  E.fromOption(() => target),
                  E.swap
                ),
              () =>
                pipe(
                  target,
                  E.fromPredicate<NonEmptyArray.NonEmptyArray<IPrismDiagnostic>, unknown, string>(
                    (target: unknown): target is string => typeof target === 'string',
                    () => [{ message: 'Target is not a string', code: '422', severity: DiagnosticSeverity.Error }]
                  ),
                  E.chain(target => deserializeAndValidate(content, schema, target))
                )
            ),
            E.mapLeft(diagnostics => applyPrefix(this.prefix, diagnostics))
          )
      )
    );
  }
}

function applyPrefix(
  prefix: string,
  diagnostics: NonEmptyArray.NonEmptyArray<IPrismDiagnostic>
): NonEmptyArray.NonEmptyArray<IPrismDiagnostic> {
  return pipe(
    diagnostics,
    NonEmptyArray.map(d => ({ ...d, path: [prefix, ...(d.path || [])] }))
  );
}

function validateAgainstReservedCharacters(
  encodedUriParams: Dictionary<string>,
  encodings: IHttpEncoding[]
): E.Either<NonEmptyArray.NonEmptyArray<IPrismDiagnostic>, Dictionary<string>> {
  return pipe(
    encodings,
    Array.reduce<IHttpEncoding, IPrismDiagnostic[]>([], (diagnostics, encoding) => {
      const allowReserved = get(encoding, 'allowReserved', false);
      const property = encoding.property;
      const value = encodedUriParams[property];

      if (!allowReserved && typeof value === 'string' && /[/?#[\]@!$&'()*+,;=]/.test(value)) {
        diagnostics.push({
          path: [property],
          message: 'Reserved characters used in request body',
          severity: DiagnosticSeverity.Error,
        });
      }

      return diagnostics;
    }),
    diagnostics => (Array.isNonEmpty(diagnostics) ? E.left(diagnostics) : E.right(encodedUriParams))
  );
}
