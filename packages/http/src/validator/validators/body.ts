import { IPrismDiagnostic } from '@stoplight/prism-core';
import { DiagnosticSeverity, Dictionary, IHttpEncoding, IMediaTypeContent } from '@stoplight/types';
import * as Array from 'fp-ts/lib/Array';
import * as Either from 'fp-ts/lib/Either';
import * as Option from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { get, partial } from 'lodash';
import * as typeIs from 'type-is';

import { JSONSchema } from '../../types';
import { body } from '../deserializers';
import { IHttpValidator } from './types';
import { validateAgainstSchema } from './utils';
import { eqString } from 'fp-ts/lib/Eq';

export class HttpBodyValidator implements IHttpValidator<any, IMediaTypeContent> {
  constructor(private prefix: string) {}

  public validate(target: any, specs: IMediaTypeContent[], mediaType?: string): IPrismDiagnostic[] {
    const content = getContent(specs, mediaType);
    const schema = get(content, 'schema');

    return pipe(
      Either.fromNullable([])(schema),
      Either.map(() => target),
      Either.chain(partial(maybeValidateFormBody, schema!, content, mediaType)),
      Either.chain(partial(validateBody, schema!)),
      Either.fold(partial(applyPrefix, this.prefix), () => []),
    );
  }
}

function validateBody(schema: JSONSchema, target: any) {
  const diagnostics = validateAgainstSchema(target, schema);
  return diagnostics.length ? Either.left(diagnostics) : Either.right(target);
}

function maybeValidateFormBody(
  schema: JSONSchema,
  content: IMediaTypeContent,
  mediaType: Option.Option<string>,
  target: any,
) {
  if (Option.getEq(eqString).equals(mediaType, Option.some('application/x-www-form-urlencoded'))) {
    const encodings = get(content, 'encodings', []);
    const encodedUriParams = splitUriParams(target);

    return pipe(
      validateAgainstReservedCharacters(encodedUriParams, encodings),
      Either.map(decodeUriEntities),
      Either.map(deserializeFormBody.bind(undefined, schema, encodings)),
    );
  }

  return Either.right(target);
}

function applyPrefix(prefix: string, diagnostics: IPrismDiagnostic[]): IPrismDiagnostic[] {
  return diagnostics.map(d => ({ ...d, path: [prefix, ...(d.path || [])] }));
}

function validateAgainstReservedCharacters(encodedUriParams: Dictionary<string, string>, encodings: IHttpEncoding[]) {
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

function getContent(specs: IMediaTypeContent[], mediaType?: string) {
  return pipe(
    specs,
    Array.findFirst(spec => spec.mediaType === mediaType),
    Option.getOrElse(() => specs[0]),
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
