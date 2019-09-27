import { IPrismDiagnostic } from '@stoplight/prism-core';
import { IMediaTypeContent } from '@stoplight/types';
import { get } from 'lodash';
import * as typeIs from 'type-is';
import { body } from '../deserializers';

import { DiagnosticSeverity, Dictionary } from '@stoplight/types';
import { findFirst } from 'fp-ts/lib/Array';
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
      const uriParams = splitUriParams(target);
      target = decodeUriEntities(uriParams);

      const encodings = get(content, 'encodings', []);
      for (const encoding of encodings) {
        const allowReserved = get(encoding, 'allowReserved', false);
        const property = encoding.property;
        const value = uriParams[property];

        if (!allowReserved && typeof value === 'string' && value.match(/[\/?#\[\]@!$&'()*+,;=]/)) {
          return [
            {
              path: [prefix, property],
              message: 'Reserved characters used in request body',
              severity: DiagnosticSeverity.Error,
            },
          ];
        }
      }

      if (schema.properties) {
        const newTarget = {};

        for (const property of Object.keys(schema.properties)) {
          newTarget[property] = target[property];
          const encoding = encodings.find(enc => enc.property === property);

          if (encoding && encoding.style) {
            const deserializer = body.get(encoding.style);
            if (deserializer && schema.properties) {
              const propertySchema = schema.properties[property];
              newTarget[property] = deserializer.deserialize(property, target, propertySchema as JSONSchema);
            }
          }
        }

        target = newTarget;
      }
    }

    return validateAgainstSchema(target, schema).map(error =>
      Object.assign({}, error, { path: [prefix, ...(error.path || [])] }),
    );
  }
}

function getContent(specs: IMediaTypeContent[], mediaType?: string) {
  return pipe(
    specs,
    findFirst(spec => spec.mediaType === mediaType),
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
