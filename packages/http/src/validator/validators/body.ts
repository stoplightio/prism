import { IPrismDiagnostic } from '@stoplight/prism-core';
import { DiagnosticSeverity, Dictionary, IHttpEncoding, IMediaTypeContent } from '@stoplight/types';
import * as Array from 'fp-ts/lib/Array';
import * as Either from 'fp-ts/lib/Either';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import * as Option from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { get } from 'lodash';
import { JSONSchema } from '../../types';
import { body } from '../deserializers';
import { validateAgainstSchema } from './utils';

function deserializeFormBody(
  schema: JSONSchema,
  encodings: IHttpEncoding[],
  decodedUriParams: Dictionary<string, string>,
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
    }),
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
    Option.map(content => ({ mediaType, content })),
  );
}

// should be put somewhere else, not under /validators
export function deserialize(content: IMediaTypeContent, schema: JSONSchema, target: string) {
  const encodings = get(content, 'encodings', []);
  const encodedUriParams = splitUriParams(target);

  return pipe(
    validateAgainstReservedCharacters(encodedUriParams, encodings),
    Either.map(decodeUriEntities),
    Either.map(decodedUriEntities => deserializeFormBody(schema, encodings, decodedUriEntities)),
  );
}

export const getMediaTypeWithContentAndSchema = (specs: IMediaTypeContent[], mediaType: any) => {
  return pipe(
    Option.fromNullable(mediaType),
    Option.chain(mt => findContentByMediaTypeOrFirst(specs, mt)),
    Option.alt(() => Option.some({ content: specs[0] || {}, mediaType: 'random' })),
    Option.chain(({ mediaType: mt, content }) =>
      pipe(
        Option.fromNullable(content.schema),
        Option.map(schema => ({ schema, mediaType: mt, content })),
      ),
    ),
  );
};

export class HttpBodyValidator {
  // `this.prefix` isn't very fp, should just remove the constructor and pass `prefix` it to `validate`
  constructor(private prefix: string) {}

  public validate(
    target: any,
    specs: IMediaTypeContent[],
    mediaType?: string,
    schema?: any,
  ): Either.Either<NonEmptyArray<IPrismDiagnostic>, any> {
    return pipe(
      validateAgainstSchema(target, schema),
      diagnostics => applyPrefix(this.prefix, diagnostics),
      // TODO: should adjust/change/take a closer look at the last following 2 lines:
      Option.fromNullable,
      Option.fold(() => Either.right([]), x => {
        if (x.length) {
          return Either.left(x as NonEmptyArray<IPrismDiagnostic>)
        } else {
          return Either.right([])
        }
      }),
    );
  }
}

function applyPrefix(prefix: string, diagnostics: IPrismDiagnostic[]): IPrismDiagnostic[] {
  return diagnostics.map(d => ({ ...d, path: [prefix, ...(d.path || [])] }));
}

function validateAgainstReservedCharacters(
  encodedUriParams: Dictionary<string, string>,
  encodings: IHttpEncoding[],
): Either.Either<IPrismDiagnostic[], Dictionary<string, string>> {
  return pipe(
    encodings,
    Array.reduce<IHttpEncoding, IPrismDiagnostic[]>([], (diagnostics, encoding) => {
      const allowReserved = get(encoding, 'allowReserved', false);
      const property = encoding.property;
      const value = encodedUriParams[property];

      if (!allowReserved && typeof value === 'string' && value.match(/[\/?#\[\]@!$&'()*+,;=]/)) {
        diagnostics.push({
          path: [property],
          message: 'Reserved characters used in request body',
          severity: DiagnosticSeverity.Error,
        });
      }

      return diagnostics;
    }),
    diagnostics => (diagnostics.length ? Either.left(diagnostics) : Either.right(encodedUriParams)),
  );
}
