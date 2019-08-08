import { Dictionary } from '@stoplight/types/dist';
import * as Either from 'fp-ts/lib/Either';
import { fromNullable, getOrElse, mapNullable } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { get } from 'lodash';

type Headers = Dictionary<string, string>;

export type AuthErr = { name: string; message: string; status: number; headers: Headers };
export type SecurityScheme = { type: string; name: string; in?: string; scheme?: string };

const genUnauthorisedErr = (msg: string): AuthErr => ({
  name: 'Unauthorised',
  message: 'Invalid security scheme used',
  status: 401,
  headers: { 'WWW-Authenticate': msg },
});

function isBasicToken(token: string) {
  const tokenParts = Buffer.from(token, 'base64')
    .toString()
    .split(':');

  return tokenParts.length === 2;
}

const httpBasic = {
  test: ({ scheme, type }: SecurityScheme) => scheme === 'basic' && type === 'http',
  handle: <R, I>(someInput: I, name: string, resource?: R) => {
    const authorizationHeader = get(someInput, ['headers', 'authorization'], '');

    return authorizationHeader
      ? checkHeader<R>(authorizationHeader, resource)
      : Either.left(genUnauthorisedErr(basicWWWAuthenticate));
  },
};

const digestWWWAuthenticate = 'Digest realm="*", nonce="abc123"';

const httpDigest = {
  test: ({ scheme, type }: SecurityScheme) => scheme === 'digest' && type === 'http',
  handle: <R, I>(someInput: I, name: string, resource?: R) => {
    const authorizationHeader = get(someInput, ['headers', 'authorization'], '');

    return get(someInput, ['headers', 'authorization'], '')
      ? checkDigestHeader(authorizationHeader, resource)
      : Either.left(genUnauthorisedErr(digestWWWAuthenticate));
  },
};

function isDigestInfo(info: string[]) {
  const infoAsString = info.join('');

  return (
    infoAsString.includes('username=') &&
    infoAsString.includes('realm=') &&
    infoAsString.includes('nonce=') &&
    infoAsString.includes('uri=') &&
    infoAsString.includes('response=') &&
    info.every((schemeParam: string) => new RegExp(/(?:'|")([a-z0-9]*)(?:'|")/).test(schemeParam))
  );
}

const invalidCredsErr = Either.left({
  name: 'Forbidden',
  status: 403,
  message: 'Invalid credentials used',
  headers: {},
});

function checkDigestHeader<R>(authorizationHeader: string, resource?: R) {
  const [authScheme, ...info] = authorizationHeader.split(' ');

  const isDigestInfoGiven = info && isDigestInfo(info);
  const isDigestScheme = isScheme(authScheme, 'digest');

  return genRespForScheme(isDigestScheme, isDigestInfoGiven, resource, digestWWWAuthenticate);
}

function isScheme(authScheme: string, shouldBeScheme: string) {
  return (authScheme || '').toLowerCase() === shouldBeScheme;
}

function checkHeader<R>(authorizationHeader: string, resource?: R) {
  const [authScheme, token] = authorizationHeader.split(' ');

  const isBasicTokenGiven = !!(token && isBasicToken(token));
  const isBasicScheme = isScheme(authScheme, 'basic');

  return genRespForScheme(isBasicScheme, isBasicTokenGiven, resource, basicWWWAuthenticate);
}

function genRespForScheme<R>(isSchemeProper: boolean, isCredsGiven: boolean, resource: R, msg: string) {
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

const basicWWWAuthenticate = 'Basic realm="*"';

const apiKeyInHeader = {
  test: ({ type, in: where }: SecurityScheme) => where === 'header' && type === 'apiKey',
  handle: <R, I>(someInput: I, name: string, resource?: R) => {
    const isAPIKeyProvided = get(someInput, ['headers', name.toLowerCase()]);

    return when<R>(isAPIKeyProvided, name, resource);
  },
};

const apiKeyInQuery = {
  test: ({ type, in: where }: SecurityScheme) => where === 'query' && type === 'apiKey',
  handle: <R, I>(someInput: I, name: string, resource?: R) => {
    const isApiKeyInQuery = get(someInput, ['url', 'query', name]);

    return when<R>(isApiKeyInQuery, name, resource);
  },
};

const bearerHandler = <R, I>(msg: string, someInput: I, name: string, resource?: R) => {
  return when<R>(isBearerToken(get(someInput, 'headers')), msg, resource);
};

const openIdConnect = {
  test: ({ type }: SecurityScheme) => type === 'openIdConnect',
  handle: bearerHandler.bind({}, 'OpenID'),
};

const bearer = {
  test: ({ type, scheme }: SecurityScheme) => scheme === 'bearer' && type === 'http',
  handle: bearerHandler.bind({}, 'Bearer'),
};

const oauth2 = {
  test: ({ type }: SecurityScheme) => type === 'oauth2',
  handle: bearerHandler.bind({}, 'OAuth2'),
};

const apiKeyInCookie = {
  test: ({ type, in: where }: SecurityScheme) => where === 'cookie' && type === 'apiKey',
  handle: <R, I>(someInput: I, name: string, resource?: R) => {
    const probablyCookie = get(someInput, ['headers', 'cookie']);

    const isApiKeyInCookie = pipe(
      fromNullable(probablyCookie),
      mapNullable(cookie => new RegExp(`${name}=.+`).test(cookie)),
      getOrElse(() => false),
    );

    return when<R>(isApiKeyInCookie, `Cookie realm="*" cookie-name=${name}`, resource);
  },
};

function when<R>(isOk: boolean, msg: string, resource?: R) {
  return isOk ? Either.right(resource) : Either.left(genUnauthorisedErr(msg));
}

function isBearerToken(inputHeaders: Headers) {
  return pipe(
    fromNullable(inputHeaders.authorization),
    mapNullable(authorization => !!authorization.match(/^Bearer\s.+$/)),
    getOrElse(() => false),
  );
}

export const securitySchemaHandlers = [
  httpBasic,
  httpDigest,
  apiKeyInHeader,
  apiKeyInQuery,
  apiKeyInCookie,
  oauth2,
  bearer,
  openIdConnect,
];
