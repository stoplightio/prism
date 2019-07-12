import { IPrismDiagnostic } from '@stoplight/prism-core';
import { JSONSchema } from '../../';

export interface IHttpValidator<Target, Specs> {
  validate(target: Target, specs: Specs[], mediaType?: string): IPrismDiagnostic[];
}

export interface ISchemaValidator<S = JSONSchema> {
  validate(content: any, schema: S): IPrismDiagnostic[];
  supports(mediaType: string): boolean;
}
