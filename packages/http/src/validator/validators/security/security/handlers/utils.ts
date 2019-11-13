import { DiagnosticSeverity, IHttpOperation } from '@stoplight/types';
import { Either, left, right } from 'fp-ts/lib/Either';
import { IPrismDiagnostic } from '@stoplight/prism-core';

export function genRespForScheme(
  isSchemeProper: boolean,
  isCredsGiven: boolean,
  resource: IHttpOperation,
  msg: string
): Either<IPrismDiagnostic, IHttpOperation> {
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

export function when(
  condition: boolean,
  errorMessage: string | undefined,
  resource: IHttpOperation
): Either<IPrismDiagnostic, IHttpOperation> {
  return condition ? right(resource) : left(genUnauthorisedErr(errorMessage));
}
