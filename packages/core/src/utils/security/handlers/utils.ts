import { DiagnosticSeverity } from '@stoplight/types';
import { Either, left, right } from 'fp-ts/lib/Either';
import { IPrismDiagnostic } from '../../../types';

const forbiddenErr: IPrismDiagnostic = {
  code: 403,
  message: 'Invalid credentials used',
  severity: DiagnosticSeverity.Error,
};

const invalidCredsErr = left(forbiddenErr);

export function genRespForScheme<R>(
  isSchemeProper: boolean,
  isCredsGiven: boolean,
  resource: R,
  msg: string,
): Either<IPrismDiagnostic, R> {
  const handler = [
    {
      test: () => isSchemeProper && isCredsGiven,
      handle: () => right(resource),
    },
    {
      test: () => isSchemeProper,
      handle: () => invalidCredsErr,
    },
  ].find(possibleHandler => possibleHandler.test());

  return handler ? handler.handle() : left(genUnauthorisedErr(msg));
}

export const genUnauthorisedErr = (msg: string): IPrismDiagnostic => ({
  severity: DiagnosticSeverity.Error,
  message: 'Invalid security scheme used',
  code: 401,
  tags: msg ? [msg] : [],
});

export function isScheme(shouldBeScheme: string, authScheme: string) {
  return (authScheme || '').toLowerCase() === shouldBeScheme;
}

export function when(condition: boolean, errorMessage: string, resource?: unknown): Either<IPrismDiagnostic, unknown> {
  return condition ? right(resource) : left(genUnauthorisedErr(errorMessage));
}
