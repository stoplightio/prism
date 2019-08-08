import * as Either from 'fp-ts/lib/Either';
import { get } from 'lodash';
import { SecurityScheme } from './types';
import { genRespForScheme, genUnauthorisedErr, isScheme } from './utils';

const basicWWWAuthenticate = 'Basic realm="*"';

function checkHeader<R>(authorizationHeader: string, resource?: R) {
  const [authScheme, token] = authorizationHeader.split(' ');

  const isBasicTokenGiven = !!(token && isBasicToken(token));
  const isBasicScheme = isScheme(authScheme, 'basic');

  return genRespForScheme(isBasicScheme, isBasicTokenGiven, resource, basicWWWAuthenticate);
}

function isBasicToken(token: string) {
  const tokenParts = Buffer.from(token, 'base64')
    .toString()
    .split(':');

  return tokenParts.length === 2;
}

export const httpBasic = {
  test: ({ scheme, type }: SecurityScheme) => scheme === 'basic' && type === 'http',
  handle: <R, I>(someInput: I, name: string, resource?: R) => {
    const authorizationHeader = get(someInput, ['headers', 'authorization'], '');

    return authorizationHeader
      ? checkHeader<R>(authorizationHeader, resource)
      : Either.left(genUnauthorisedErr(basicWWWAuthenticate));
  },
};
