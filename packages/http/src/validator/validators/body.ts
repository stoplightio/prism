import { IPrismDiagnostic } from '@stoplight/prism-core';
import { DiagnosticSeverity, Dictionary, IHttpEncoding, IMediaTypeContent } from '@stoplight/types';
import * as Array from 'fp-ts/lib/Array';
import * as Either from 'fp-ts/lib/Either';
import * as Option from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { get } from 'lodash';
import * as typeIs from 'type-is';
import { JSONSchema } from '../../types';
import { body } from '../deserializers';
import { IHttpValidator } from './types';
import { validateAgainstSchema } from './utils';
import { fromArray } from 'fp-ts/lib/NonEmptyArray';

function deserializeFormBody(
  schema: JSONSchema,
  encodings: IHttpEncoding[],
  decodedUriParams: Dictionary<string, string>
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

function splitUriParams(target: string) {
  return target.split('&').reduce((result: Dictionary<string, string>, pair: string) => {
    const [key, ...rest] = pair.split('=');
    result[key] = rest.join('=');
    return result;
  }, {});
}

function decodeUriEntities(target: Dictionary<string, string>) {
  return Object.entries(target).reduce((result, [k, v]) => {
    result[decodeURIComponent(k)] = decodeURIComponent(v);
    return result;
  }, {});
}

function findContentByMediaTypeOrFirst(specs: IMediaTypeContent[], mediaType: string) {
  return pipe(
    specs,
    Array.findFirst(spec => spec.mediaType === mediaType),
    Option.alt(() => Array.head(specs)),
    Option.map(content => ({ mediaType, content }))
  );
}

function validateBodyIfNotFormEncoded(mediaType: string, schema: JSONSchema, target: unknown) {
  return pipe(
    mediaType,
    Option.fromPredicate(mt => !typeIs.is(mt, ['application/x-www-form-urlencoded'])),
    Option.chain(() => validateAgainstSchema(target, schema))
  );
}

function deserializeAndValidate(content: IMediaTypeContent, schema: JSONSchema, target: string) {
  const encodings = get(content, 'encodings', []);
  const encodedUriParams = splitUriParams(target);

  return pipe(
    validateAgainstReservedCharacters(encodedUriParams, encodings),
    Either.map(decodeUriEntities),
    Either.map(decodedUriEntities => deserializeFormBody(schema, encodings, decodedUriEntities)),
    Either.fold(
      e => Option.some(e),
      deserialised => validateAgainstSchema(deserialised, schema)
    )
  );
}

export class HttpBodyValidator implements IHttpValidator<any, IMediaTypeContent> {
  constructor(private prefix: string) {}

  public validate(target: any, specs: IMediaTypeContent[], mediaType?: string) {
    const mediaTypeWithContentAndSchema = pipe(
      Option.fromNullable(mediaType),
      Option.chain(mt => findContentByMediaTypeOrFirst(specs, mt)),
      Option.alt(() => Option.some({ content: specs[0] || {}, mediaType: 'random' })),
      Option.chain(({ mediaType: mt, content }) =>
        pipe(
          Option.fromNullable(content.schema),
          Option.map(schema => ({ schema, mediaType: mt, content }))
        )
      )
    );

    return pipe(
      mediaTypeWithContentAndSchema,
      Option.chain(({ content, mediaType: mt, schema }) =>
        pipe(
          validateBodyIfNotFormEncoded(mt, schema, target),
          Option.alt(() => deserializeAndValidate(content, schema, target)),
          Option.map(diagnostics => applyPrefix(this.prefix, diagnostics))
        )
      ),
      Option.chain(fromArray),
      Either.fromOption(() => target),
      Either.swap
    );
  }
}

function applyPrefix(prefix: string, diagnostics: IPrismDiagnostic[]): IPrismDiagnostic[] {
  return diagnostics.map(d => ({ ...d, path: [prefix, ...(d.path || [])] }));
}

function validateAgainstReservedCharacters(
  encodedUriParams: Dictionary<string, string>,
  encodings: IHttpEncoding[]
): Either.Either<IPrismDiagnostic[], Dictionary<string, string>> {
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
    diagnostics => (diagnostics.length ? Either.left(diagnostics) : Either.right(encodedUriParams))
  );
}
