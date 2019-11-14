import { left } from 'fp-ts/lib/Either';
import { get } from 'lodash';
import { genRespForScheme, genUnauthorisedErr, isScheme } from './utils';
import { IHttpRequest } from '../../../../types';

const basicWWWAuthenticate = 'Basic realm="*"';

function checkHeader(authorizationHeader: string) {
  const [authScheme, token] = authorizationHeader.split(' ');

  const isBasicTokenGiven = !!(token && isBasicToken(token));
  const isBasicScheme = isScheme('basic', authScheme);

  return genRespForScheme(isBasicScheme, isBasicTokenGiven, basicWWWAuthenticate);
}

function isBasicToken(token: string) {
  const tokenParts = Buffer.from(token, 'base64')
    .toString()
    .split(':');

  return tokenParts.length === 2;
}

export const httpBasic = (input: Pick<IHttpRequest, 'headers' | 'url'>) => {
  const authorizationHeader = get(input, ['headers', 'authorization'], '');

  return authorizationHeader ? checkHeader(authorizationHeader) : left(genUnauthorisedErr(basicWWWAuthenticate));
};
