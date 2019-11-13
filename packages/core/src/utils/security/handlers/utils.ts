import { DiagnosticSeverity } from '@stoplight/types';
import { Either, left, right } from 'fp-ts/lib/Either';
import { IPrismDiagnostic } from '../../../types';

export function genRespForScheme<R>(
  isSchemeProper: boolean,
  isCredsGiven: boolean,
  resource: R,
  msg: string
): Either<IPrismDiagnostic, R> {
  if (isSchemeProper) {
    return when(isCredsGiven, undefined, resource);
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

export function when<R>(
  condition: boolean,
  errorMessage: string | undefined,
  resource: R
): Either<IPrismDiagnostic, R> {
  return condition ? right(resource) : left(genUnauthorisedErr(errorMessage));
}
