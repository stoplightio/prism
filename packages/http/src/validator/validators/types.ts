import { INoRangeDiagnostic } from '@stoplight/prism-core/src/types';
import { ISchema } from '@stoplight/types';

export interface IHttpValidator<Target, Specs> {
  validate(target: Target, specs: Specs[], mediaType?: string): INoRangeDiagnostic[];
}

export interface ISchemaValidator<S extends ISchema> {
  validate(content: any, schema: S): INoRangeDiagnostic[];
  supports(mediaType: string): boolean;
}

export interface IValidatorRegistry {
  get(mediaType: string): ((content: any, schema: ISchema) => INoRangeDiagnostic[]) | undefined;
}
