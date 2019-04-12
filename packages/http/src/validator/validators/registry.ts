import { ISchema } from '@stoplight/types';

import { IPrismDiagnostic } from '@stoplight/prism-core/src/types';
import { ISchemaValidator, IValidatorRegistry } from './types';

export class ValidatorRegistry implements IValidatorRegistry {
  constructor(private validators: Array<ISchemaValidator<ISchema>>) {}

  public get(
    mediaType: string
  ): ((content: any, schema: ISchema) => IPrismDiagnostic[]) | undefined {
    const validator = this.validators.find(v => v.supports(mediaType));

    if (!validator) {
      return;
    }

    return validator.validate.bind(validator);
  }
}
