import { left } from 'fp-ts/lib/Either';
import { get } from 'lodash';
import { SecurityScheme } from './types';
import { genRespForScheme, genUnauthorisedErr, isScheme } from './utils';

const basicWWWAuthenticate = 'Basic realm="*"';

function checkHeader(authorizationHeader: string, resource?: unknown) {
  const [authScheme, token] = authorizationHeader.split(' ');

  const isBasicTokenGiven = !!(token && isBasicToken(token));
  const isBasicScheme = isScheme('basic', authScheme);

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
  handle: (someInput: unknown, name: string, resource?: unknown) => {
    const authorizationHeader = get(someInput, ['headers', 'authorization'], '');

    return authorizationHeader
      ? checkHeader(authorizationHeader, resource)
      : left(genUnauthorisedErr(basicWWWAuthenticate));
  },
};
