import { IHttpContent } from '@stoplight/types';

import { IPrismDiagnostic } from '@stoplight/prism-core/src/types';
import { IHttpValidator, IValidatorRegistry } from './types';

export class HttpBodyValidator implements IHttpValidator<any, IHttpContent> {
  constructor(private _registry: IValidatorRegistry, private _prefix: string) {}

  public validate(target: any, specs: IHttpContent[], mediaType?: string): IPrismDiagnostic[] {
    const { _registry: registry, _prefix: prefix } = this;
    const content = this.getContent(specs, mediaType);

    if (!content) {
      return [];
    }

    if (!content.schema) {
      return [];
    }

    const validate = registry.get(content.mediaType);

    if (!validate) {
      return [];
    }

    return validate(target, content.schema).map(error =>
      Object.assign({}, error, { path: [prefix, ...(error.path || [])] })
    );
  }

  private getContent(specs: IHttpContent[], mediaType?: string): IHttpContent | undefined {
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
