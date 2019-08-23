import { left } from 'fp-ts/lib/Either';
import { get } from 'lodash';
import { SecurityScheme } from './types';
import { genRespForScheme, genUnauthorisedErr, isScheme } from './utils';

const digestWWWAuthenticate = 'Digest realm="*", nonce="abc123"';

function checkDigestHeader(authorizationHeader: string, resource?: unknown) {
  const [authScheme, ...info] = authorizationHeader.split(' ');

  const isDigestInfoGiven = info && isDigestInfo(info);
  const isDigestScheme = isScheme('digest', authScheme);

  return genRespForScheme(isDigestScheme, isDigestInfoGiven, resource, digestWWWAuthenticate);
}

function isDigestInfo(info: string[]) {
  const infoAsString = info.join('');

  return (
    infoAsString.includes('username=') &&
    infoAsString.includes('realm=') &&
    infoAsString.includes('nonce=') &&
    infoAsString.includes('uri=') &&
    infoAsString.includes('response=') &&
    info.every(schemeParam => new RegExp(/(?:'|")([a-z0-9]*)(?:'|")/).test(schemeParam))
  );
}

export const httpDigest = {
  test: ({ scheme, type }: SecurityScheme) => scheme === 'digest' && type === 'http',
  handle: (someInput: unknown, name: string, resource?: unknown) => {
    const authorizationHeader = get(someInput, ['headers', 'authorization'], '');

    return authorizationHeader
      ? checkDigestHeader(authorizationHeader, resource)
      : left(genUnauthorisedErr(digestWWWAuthenticate));
  },
};
