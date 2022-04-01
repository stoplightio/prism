import * as E from 'fp-ts/Either';
import type { IPrismDiagnostic } from '@stoplight/prism-core';
import type { IHttpRequest } from '../../../../types';
export declare type ValidateSecurityFn = (input: Pick<IHttpRequest, 'headers' | 'url'>, name: string) => E.Either<IPrismDiagnostic, unknown>;
export declare const genRespForScheme: (isSchemeProper: boolean, isCredsGiven: boolean, msg: string) => E.Either<IPrismDiagnostic, unknown>;
export declare const genUnauthorisedErr: (msg?: string | undefined) => IPrismDiagnostic;
export declare function isScheme(shouldBeScheme: string, authScheme: string): boolean;
export declare const when: (condition: boolean, errorMessage?: string | undefined) => E.Either<IPrismDiagnostic, boolean>;
