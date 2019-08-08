import * as Either from 'fp-ts/lib/Either';
import { AuthErr } from './types';

const invalidCredsErr = Either.left({
  name: 'Forbidden',
  status: 403,
  message: 'Invalid credentials used',
  headers: {},
});

export function genRespForScheme<R>(isSchemeProper: boolean, isCredsGiven: boolean, resource: R, msg: string) {
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

export const genUnauthorisedErr = (msg: string): AuthErr => ({
  name: 'Unauthorised',
  message: 'Invalid security scheme used',
  status: 401,
  headers: msg ? { 'WWW-Authenticate': msg } : {},
});

export function isScheme(authScheme: string, shouldBeScheme: string) {
  return (authScheme || '').toLowerCase() === shouldBeScheme;
}

export function when<R>(isOk: boolean, msg: string, resource?: R) {
  return isOk ? Either.right(resource) : Either.left(genUnauthorisedErr(msg));
}
