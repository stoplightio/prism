import { DiagnosticSeverity } from '@stoplight/types';
import { Either, left, right } from 'fp-ts/lib/Either';
import { IPrismDiagnostic } from '@stoplight/prism-core';
import { IHttpRequest } from '../../../../types';

export type ValidateSecurityFn = (
  input: Pick<IHttpRequest, 'headers' | 'url'>,
  name: string
) => Either<IPrismDiagnostic, unknown>;

export function genRespForScheme(
  isSchemeProper: boolean,
  isCredsGiven: boolean,
  msg: string
): Either<IPrismDiagnostic, unknown> {
  if (isSchemeProper) {
    return when(isCredsGiven, undefined);
  }

  return left(genUnauthorisedErr(msg));
}

export const genUnauthorisedErr = (msg?: string): IPrismDiagnostic => ({
  severity: DiagnosticSeverity.Error,
  message: 'Invalid security scheme used',
  code: 401,
  tags: msg ? [msg] : [],
});

export function isScheme(shouldBeScheme: string, authScheme: string) {
  return authScheme.toLowerCase() === shouldBeScheme;
}

export function when(condition: boolean, errorMessage: string | undefined): Either<IPrismDiagnostic, unknown> {
  return condition ? right(true) : left(genUnauthorisedErr(errorMessage));
}
