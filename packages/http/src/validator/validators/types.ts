import { IPrismDiagnostic } from '@stoplight/prism-core';
import { JSONSchema } from '../../';
import { Either } from 'fp-ts/lib/Either';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';

export interface IHttpValidator<Target, Specs> {
  validate(target: Target, specs: Specs[], mediaType?: string): Either<NonEmptyArray<IPrismDiagnostic>, Target>;
}

export interface ISchemaValidator<S = JSONSchema> {
  validate(content: any, schema: S): IPrismDiagnostic[];
  supports(mediaType: string): boolean;
}
