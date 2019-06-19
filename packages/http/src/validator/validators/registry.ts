import { IPrismDiagnostic } from '@stoplight/prism-core';
import { JSONSchema } from '../../';
import { ISchemaValidator, IValidatorRegistry } from './types';

export class ValidatorRegistry implements IValidatorRegistry {
  constructor(private validators: Array<ISchemaValidator<JSONSchema>>) {}

  public get(mediaType: string): ((content: any, schema: JSONSchema) => IPrismDiagnostic[]) | undefined {
    const validator = this.validators.find(v => v.supports(mediaType));

    if (!validator) {
      return;
    }

    return validator.validate.bind(validator);
  }
}
