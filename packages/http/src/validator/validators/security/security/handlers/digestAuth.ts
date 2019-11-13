import { left } from 'fp-ts/lib/Either';
import { get } from 'lodash';
import { genRespForScheme, genUnauthorisedErr, isScheme } from './utils';
import { IHttpOperation, IBasicSecurityScheme } from '@stoplight/types';
import { IHttpRequest } from '../../../../../types';

const digestWWWAuthenticate = 'Digest realm="*", nonce="abc123"';

function checkDigestHeader(authorizationHeader: string, resource: IHttpOperation) {
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

export const httpDigest = (someInput: IHttpRequest, name: string, resource: IHttpOperation) => {
  const authorizationHeader = get(someInput, ['headers', 'authorization'], '');

  return authorizationHeader
    ? checkDigestHeader(authorizationHeader, resource)
    : left(genUnauthorisedErr(digestWWWAuthenticate));
};
