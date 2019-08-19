import { DiagnosticSeverity } from '@stoplight/types';
import * as Either from 'fp-ts/lib/Either';
import { IPrismDiagnostic } from '../../../types';

const forbiddenErr: IPrismDiagnostic = {
  code: 403,
  message: 'Invalid credentials used',
  headers: {},
  severity: DiagnosticSeverity.Error,
};

const invalidCredsErr = Either.left(forbiddenErr);

export function genRespForScheme<R>(
  isSchemeProper: boolean,
  isCredsGiven: boolean,
  resource: R,
  msg: string,
): Either.Either<IPrismDiagnostic, R> {
  const handler = [
    {
      test: () => isSchemeProper && isCredsGiven,
      handle: () => Either.right(resource),
    },
    {
      test: () => isSchemeProper,
      handle: () => invalidCredsErr,
    },
  ].find(possibleHandler => possibleHandler.test());

  return handler ? handler.handle() : Either.left(genUnauthorisedErr(msg));
}

export const genUnauthorisedErr = (msg: string): IPrismDiagnostic => ({
  severity: DiagnosticSeverity.Error,
  message: 'Invalid security scheme used',
  code: 401,
  headers: msg ? { 'WWW-Authenticate': msg } : {},
});

export function isScheme(authScheme: string, shouldBeScheme: string) {
  return (authScheme || '').toLowerCase() === shouldBeScheme;
}

export function when<R>(condition: boolean, errorMessage: string, resource?: R) {
  return condition ? Either.right(resource) : Either.left(genUnauthorisedErr(errorMessage));
}
