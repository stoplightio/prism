import { DiagnosticSeverity } from '@stoplight/types';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/pipeable';
import { identity } from 'fp-ts/function';
import type { IPrismDiagnostic } from '@stoplight/prism-core';
import type { IHttpRequest } from '../../../../types';

export type ValidateSecurityFn = (
  input: Pick<IHttpRequest, 'headers' | 'url'>,
  name: string
) => E.Either<IPrismDiagnostic, unknown>;

export const genRespForScheme = (
  isSchemeProper: boolean,
  isCredsGiven: boolean,
  msg: string
): E.Either<IPrismDiagnostic, unknown> =>
  pipe(
    isSchemeProper,
    E.fromPredicate(identity, () => genUnauthorisedErr(msg)),
    E.chain(() => when(isCredsGiven, undefined))
  );

export const genUnauthorisedErr = (msg?: string): IPrismDiagnostic => ({
  severity: DiagnosticSeverity.Error,
  message: 'Invalid security scheme used',
  code: 401,
  tags: msg ? [msg] : [],
});

export function isScheme(shouldBeScheme: string, authScheme: string) {
  return authScheme.toLowerCase() === shouldBeScheme;
}

export const when = (condition: boolean, errorMessage?: string): E.Either<IPrismDiagnostic, boolean> =>
  pipe(
    condition,
    E.fromPredicate(identity, () => genUnauthorisedErr(errorMessage))
  );
