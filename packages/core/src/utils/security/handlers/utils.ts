import { DiagnosticSeverity } from '@stoplight/types';
import { Either, left, right, chain, fromNullable } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { IPrismDiagnostic } from '../../../types';

export function genRespForScheme<R>(
  isSchemeProper: boolean,
  isCredsGiven: boolean,
  resource: R,
  msg: string
): Either<IPrismDiagnostic, R> {
  const handler = [
    {
      test: () => isSchemeProper && isCredsGiven,
      handle: () => right(resource),
    },
    {
      test: () => isSchemeProper,
      handle: () =>
        left<IPrismDiagnostic>({
          code: 401,
          message: 'Invalid security scheme used',
          severity: DiagnosticSeverity.Error,
        }),
    },
  ].find(possibleHandler => possibleHandler.test());

  return pipe(
    handler,
    fromNullable(genUnauthorisedErr(msg)),
    chain(handler => handler.handle())
  );
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

export function when(condition: boolean, errorMessage: string, resource: unknown): Either<IPrismDiagnostic, unknown> {
  return condition ? right(resource) : left(genUnauthorisedErr(errorMessage));
}
