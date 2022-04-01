import { IPrismDiagnostic } from '@stoplight/prism-core';
import * as O from 'fp-ts/Option';
export declare const sequenceOption: <T extends O.Option<any>[]>(...t: T & {
    readonly 0: O.Option<any>;
}) => O.Option<{ [K in keyof T]: [T[K]] extends [O.Option<infer A>] ? A : never; }>;
export declare const sequenceValidation: <T extends import("fp-ts/Either").Either<import("fp-ts/NonEmptyArray").NonEmptyArray<IPrismDiagnostic>, any>[]>(...t: T & {
    readonly 0: import("fp-ts/Either").Either<import("fp-ts/NonEmptyArray").NonEmptyArray<IPrismDiagnostic>, any>;
}) => import("fp-ts/Either").Either<import("fp-ts/NonEmptyArray").NonEmptyArray<IPrismDiagnostic>, { [K in keyof T]: [T[K]] extends [import("fp-ts/Either").Either<import("fp-ts/NonEmptyArray").NonEmptyArray<IPrismDiagnostic>, infer A>] ? A : never; }>;
