import { IPrismDiagnostic } from '@stoplight/prism-core/src/types';
import { JSONSchema4 } from 'json-schema';
import { ISchemaValidator } from './types';
import { validateAgainstSchema } from './utils';

const SUPPORTED_MEDIATYPES = ['application/json'];

export class JSONSchemaValidator implements ISchemaValidator<JSONSchema4> {
  public validate(content: any, schema: JSONSchema4): IPrismDiagnostic[] {
    let json: any = content;
    try {
      json = JSON.parse(content);
    } catch {
      // Do nothing
    }
    return validateAgainstSchema(json, schema);
  }

  public supports(mediaType: string) {
    return SUPPORTED_MEDIATYPES.indexOf(mediaType) > -1;
  }
}
