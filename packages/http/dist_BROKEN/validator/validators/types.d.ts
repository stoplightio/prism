import { IPrismDiagnostic } from '@stoplight/prism-core';
import { Either } from 'fp-ts/Either';
import { NonEmptyArray } from 'fp-ts/NonEmptyArray';
export declare enum ValidationContext {
    Input = 0,
    Output = 1
}
export declare type validateFn<Target, Specs> = (target: Target, specs: Specs[], context: ValidationContext, mediaType?: string, bundle?: unknown) => Either<NonEmptyArray<IPrismDiagnostic>, Target>;
