import { IPrismDiagnostic } from '@stoplight/prism-core';
import { Either } from 'fp-ts/Either';
import { NonEmptyArray } from 'fp-ts/NonEmptyArray';

export type validateFn<Target, Specs> = (
  target: Target,
  specs: Specs[],
  mediaType?: string
) => Either<NonEmptyArray<IPrismDiagnostic>, Target>;
