import { IPrismDiagnostic } from '@stoplight/prism-core/src/types';
import { JSONSchema } from 'http/src/types';

export interface IHttpValidator<Target, Specs> {
  validate(target: Target, specs: Specs[], mediaType?: string): IPrismDiagnostic[];
}

export interface ISchemaValidator<S = JSONSchema> {
  validate(content: any, schema: S): IPrismDiagnostic[];
  supports(mediaType: string): boolean;
}

export interface IValidatorRegistry {
  get(mediaType: string): ((content: any, schema: JSONSchema) => IPrismDiagnostic[]) | undefined;
}
