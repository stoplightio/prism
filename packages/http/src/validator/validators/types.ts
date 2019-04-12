import { IPrismDiagnostic } from '@stoplight/prism-core/src/types';
import { ISchema } from '@stoplight/types';

export interface IHttpValidator<Target, Specs> {
  validate(target: Target, specs: Specs[], mediaType?: string): IPrismDiagnostic[];
}

export interface ISchemaValidator<S extends ISchema> {
  validate(content: any, schema: S): IPrismDiagnostic[];
  supports(mediaType: string): boolean;
}

export interface IValidatorRegistry {
  get(mediaType: string): ((content: any, schema: ISchema) => IPrismDiagnostic[]) | undefined;
}
