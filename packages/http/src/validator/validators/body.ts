import { IPrismDiagnostic } from '@stoplight/prism-core';
import { IMediaTypeContent } from '@stoplight/types';
import { body } from '../deserializers';

import { validateAgainstSchema } from '../validators/utils';
import { IHttpValidator } from './types';

export class HttpBodyValidator implements IHttpValidator<any, IMediaTypeContent> {
  constructor(private _prefix: string) {}

  public validate(target: any, specs: IMediaTypeContent[], mediaType?: string): IPrismDiagnostic[] {
    const { _prefix: prefix } = this;
    const content = this.getContent(specs, mediaType);

    if (!content || !content.schema) {
      return [];
    }

    if (content.encodings && content.encodings[0]) {
      const deserializer = body.get(content.encodings[0].style);
      if (deserializer && deserializer.supports(content.encodings[0].style) && content.schema.properties) {
        const propertySchema = Object.keys(content.schema.properties)[0];
        const deserializedObject = deserializer.deserialize(propertySchema, target, Object.values(
          content.schema.properties,
        )[0] as any);

        return validateAgainstSchema(deserializedObject, Object.values(content.schema.properties)[0] as any).map(
          error => Object.assign({}, error, { path: [prefix, ...(error.path || [])] }),
        );
      }
    }

    return validateAgainstSchema(target, content.schema).map(error =>
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
