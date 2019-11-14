import { left } from 'fp-ts/lib/Either';
import { get } from 'lodash';
import { genRespForScheme, genUnauthorisedErr, isScheme } from './utils';
import { IHttpRequest } from '../../../../types';

const digestWWWAuthenticate = 'Digest realm="*", nonce="abc123"';

function checkDigestHeader(authorizationHeader: string) {
  const [authScheme, ...info] = authorizationHeader.split(' ');

  const isDigestInfoGiven = info && isDigestInfo(info);
  const isDigestScheme = isScheme('digest', authScheme);

  return genRespForScheme(isDigestScheme, isDigestInfoGiven, digestWWWAuthenticate);
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

export const httpDigest = (input: Pick<IHttpRequest, 'headers' | 'url'>) => {
  const authorizationHeader = get(input, ['headers', 'authorization'], '');

  return authorizationHeader ? checkDigestHeader(authorizationHeader) : left(genUnauthorisedErr(digestWWWAuthenticate));
};
