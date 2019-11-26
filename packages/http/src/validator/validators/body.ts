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
import { fromArray, NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';

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
    Option.map(() => ({ parsed: target, violations: validateAgainstSchema(target, schema) })),
  );
}

function deserializeAndValidate(content: IMediaTypeContent, schema: JSONSchema, target: string): Either.Either<NonEmptyArray<IPrismDiagnostic>, { parsed: unknown, violations: IPrismDiagnostic[] }> {
  const encodings = get(content, 'encodings', []);
  const encodedUriParams = splitUriParams(target);

  return pipe(
    validateAgainstReservedCharacters(encodedUriParams, encodings),
    Either.map(decodeUriEntities),
    Either.map(decodedUriEntities => deserializeFormBody(schema, encodings, decodedUriEntities)),
    Either.map(parsed => ({ violations: validateAgainstSchema(parsed, schema), parsed })),
  );
}

export class HttpBodyValidator implements IHttpValidator<any, IMediaTypeContent> {
  constructor(private prefix: string) {}

  public validate(target: any, specs: IMediaTypeContent[], mediaType?: string): Either.Either<NonEmptyArray<IPrismDiagnostic>, { parsed: any, violations: IPrismDiagnostic[] }> {
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
      Either.fromOption((): NonEmptyArray<IPrismDiagnostic> => [{ path: [], message: 'No spec matched', severity: DiagnosticSeverity.Error }]),
      Either.chain(({ content, mediaType: mt, schema }) => pipe(
        validateBodyIfNotFormEncoded(mt, schema, target),
        Option.fold(() => deserializeAndValidate(content, schema, target), a => Either.right(a)),
      )),
      Either.bimap(
        v => applyPrefix(this.prefix, v) as NonEmptyArray<IPrismDiagnostic>,
        ({ parsed, violations }) => ({ parsed, violations: applyPrefix(this.prefix, violations) })
      ),
    );
  }
}

function applyPrefix(prefix: string, diagnostics: IPrismDiagnostic[]): IPrismDiagnostic[] {
  return diagnostics.map(d => ({ ...d, path: [prefix, ...(d.path || [])] }));
}

function validateAgainstReservedCharacters(
  encodedUriParams: Dictionary<string, string>,
  encodings: IHttpEncoding[]
): Either.Either<NonEmptyArray<IPrismDiagnostic>, Dictionary<string, string>> {
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
    diagnostics => pipe(fromArray(diagnostics), Option.fold(() => Either.right(encodedUriParams), violations => Either.left(violations)))
    );
}
