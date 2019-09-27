import { IPrismDiagnostic } from '@stoplight/prism-core';
import { IMediaTypeContent } from '@stoplight/types';
import { get } from 'lodash';
import * as typeIs from 'type-is';
import { body } from '../deserializers';

import { DiagnosticSeverity, Dictionary } from '@stoplight/types';
import { IHttpEncoding } from '@stoplight/types/dist';
import * as Array from 'fp-ts/lib/Array';
import { getOrElse } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { JSONSchema } from '../../types';
import { validateAgainstSchema } from '../validators/utils';
import { IHttpValidator } from './types';

export class HttpBodyValidator implements IHttpValidator<any, IMediaTypeContent> {
  constructor(private _prefix: string) {}

  public validate(target: any, specs: IMediaTypeContent[], mediaType?: string): IPrismDiagnostic[] {
    const { _prefix: prefix } = this;
    const content = getContent(specs, mediaType);
    const schema = get(content, 'schema');

    if (!schema) {
      return [];
    }

    if (mediaType && typeIs.is(mediaType, 'application/x-www-form-urlencoded')) {
      const encodedUriParams = splitUriParams(target);
      target = decodeUriEntities(encodedUriParams);
      const encodings = get(content, 'encodings', []);
      const diagnostics = validateAgainstReservedCharacters(encodedUriParams, encodings);

      if (diagnostics.length) {
        return diagnostics;
      }

      target = deserializeFormBody(target, schema, encodings);
    }

    return validateAgainstSchema(target, schema).map(error =>
      Object.assign({}, error, { path: [prefix, ...(error.path || [])] }),
    );
  }
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
  );
}

function deserializeFormBody(
  decodedUriParams: Dictionary<string, string>,
  schema: JSONSchema,
  encodings: IHttpEncoding[],
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
    getOrElse(() => specs[0]),
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
