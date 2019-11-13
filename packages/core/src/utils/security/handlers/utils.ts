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
    if (isCredsGiven) {
      return right(resource);
    }
    return left<IPrismDiagnostic>({
      code: 401,
      message: 'Invalid security scheme used',
      severity: DiagnosticSeverity.Error,
    });
  }

  return left(genUnauthorisedErr(msg));
}

export const genUnauthorisedErr = (msg: string): IPrismDiagnostic => ({
  severity: DiagnosticSeverity.Error,
  message: 'Invalid security scheme used',
  code: 401,
  tags: msg ? [msg] : [],
});

export function isScheme(shouldBeScheme: string, authScheme: string) {
  return authScheme.toLowerCase() === shouldBeScheme;
}

export function when(condition: boolean, errorMessage: string, resource: unknown): Either<IPrismDiagnostic, unknown> {
  return condition ? right(resource) : left(genUnauthorisedErr(errorMessage));
}
