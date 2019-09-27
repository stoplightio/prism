import { IPrismDiagnostic } from '@stoplight/prism-core';
import { IMediaTypeContent } from '@stoplight/types';
import { get } from 'lodash';
import { parse as deepParseUrlEncoded } from 'qs';
import * as typeIs from 'type-is';
import { body } from '../deserializers';

import { DiagnosticSeverity, Dictionary } from '@stoplight/types';
import { JSONSchema } from '../../types';
import { validateAgainstSchema } from '../validators/utils';
import { IHttpValidator } from './types';

export class HttpBodyValidator implements IHttpValidator<any, IMediaTypeContent> {
  constructor(private _prefix: string) {}

  public validate(target: any, specs: IMediaTypeContent[], mediaType?: string): IPrismDiagnostic[] {
    const { _prefix: prefix } = this;
    const content = this.getContent(specs, mediaType);

    const schema = get(content, 'schema');

    if (!schema) {
      return [];
    }

    if (mediaType && typeIs.is(mediaType, 'application/x-www-form-urlencoded')) {
      const shallowParsedTarget = shallowParseUrlEncoded(target);
      target = deepParseUrlEncoded(target);

      const encodings = get(content, 'encodings', []);
      for (const encoding of encodings) {
        const allowReserved = get(encoding, 'allowReserved', false);
        const property = encoding.property;
        const value = shallowParsedTarget[property];

        if (!allowReserved && typeof value === 'string' && value.match(/[\/?#\[\]@!$&'()*+,;=]/)) {
          return [
            {
              path: [prefix, property],
              message: 'Reserved characters used in request body',
              severity: DiagnosticSeverity.Error,
            },
          ];
        }

        if (encoding.style) {
          const deserializer = body.get(encoding.style);
          if (deserializer && schema.properties) {
            const propertySchema = schema.properties[property];
            target[property] = deserializer.deserialize(property, target, propertySchema as JSONSchema);
          }
        }
      }
    }

    return validateAgainstSchema(target, schema).map(error =>
      Object.assign({}, error, { path: [prefix, ...(error.path || [])] }),
    );
  }

  private getContent(specs: IMediaTypeContent[], mediaType?: string): IMediaTypeContent | undefined {
    if (!mediaType) {
      return specs[0];
    }

    const content = specs.find(c => c.mediaType === mediaType);

    if (!content) {
      return specs[0];
    }

    return content;
  }
}

function shallowParseUrlEncoded(target: string) {
  return target.split('&').reduce((result: Dictionary<string, string>, pair: string) => {
    const [key, ...rest] = pair.split('=');
    result[key] = rest.join('=');
    return result;
  }, {});
}
